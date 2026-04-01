import os
import traceback
import asyncio
from dotenv import load_dotenv

load_dotenv(override=True)

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from backend.db.database import create_job, add_candidate, get_job, get_job_candidates
from backend.worker import enqueue_job, worker_loop
from backend.tools.pdf_tools import extract_text_from_resume
from backend.orchestrator import RecruitmentOrchestrator
from pydantic import BaseModel
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

class JDRequest(BaseModel):
    text: str

app = FastAPI(title="AI Recruitment Scalable API")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

worker_task = None
orchestrator = RecruitmentOrchestrator()

@app.on_event("startup")
async def startup_event():
    global worker_task
    # Clean restart fallback: we could reload un-completed jobs from DB here, but an enqueue is decent starting logic.
    worker_task = asyncio.create_task(worker_loop())

@app.post("/analyze-jd")
async def analyze_jd(req: JDRequest):
    try:
        return await orchestrator.execute("analyze_jd", {"text": req.text})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from typing import List, Annotated

@app.post("/upload-batch")
async def upload_batch(
    jd_text: Annotated[str, Form()],
    names: Annotated[List[str], Form()] = None,
    emails: Annotated[List[str], Form()] = None,
    githubs: Annotated[List[str], Form()] = None,
    files: Annotated[List[UploadFile], File()] = None
):
    try:
        # FastAPI might receive a single string for a list if only one item is sent
        # depending on version/client. We'll normalize them here.
        def ensure_list(x):
            if x is None: return []
            if isinstance(x, str): return [x]
            return list(x)

        names = ensure_list(names)
        emails = ensure_list(emails)
        githubs = ensure_list(githubs)
        
        # files is already a list of UploadFile if multiple, or single UploadFile if one
        if files and not isinstance(files, list):
            files = [files]
        elif not files:
            files = []

        if not (len(names) == len(emails) == len(githubs) == len(files)):
            raise HTTPException(400, "Mismatched lengths of candidate metadata and files.")
            
        job_id = create_job(jd_text)
        print(f"[API] Created job {job_id}. Reading {len(files)} files...")
        
        for idx in range(len(names)):
            file = files[idx]
            pdf_text = extract_text_from_resume(file.file, file.filename)
            add_candidate(
                job_id=job_id,
                name=names[idx],
                email=emails[idx],
                github_username=githubs[idx],
                pdf_text=pdf_text
            )
            
        enqueue_job(job_id)
        
        return {"job_id": job_id, "status": "enqueued", "candidates_added": len(names)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status/{job_id}")
async def job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
        
    cands = get_job_candidates(job_id)
    total = len(cands)
    completed = sum(1 for c in cands if c["status"] in ["scored", "failed"])
    failed = sum(1 for c in cands if c["status"] == "failed")
    
    return {
        "job_id": job["job_id"],
        "job_status": job["status"], 
        "total_candidates": total,
        "completed": completed,
        "failed": failed,
        "progress_percent": int((completed / total * 100)) if total > 0 else 0
    }

@app.get("/dashboard/{job_id}")
async def get_dashboard(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
        
    cands = get_job_candidates(job_id)
    
    scored_candidates = []
    for c in cands:
        if c["status"] == "scored" and c["score_data"]:
            item = c["score_data"].copy()
            item["name"] = c["name"]
            item["original_profile"] = {
                "github_username": c["github_username"],
                "email": c["email"]
            }
            # Expose raw parsed resume and github context for the insights modal
            item["resume"] = c["resume_data"] 
            item["github"] = c["github_data"]
            scored_candidates.append(item)
            
    return {
        "jd_analysis": job["jd_analysis"],
        "scoredCandidates": scored_candidates,
        "comparisonSummary": job["comparison_summary"]
    }

class EmailRequest(BaseModel):
    selected_candidates: list

@app.post("/send-emails")
async def send_emails(req: EmailRequest):
    try:
        sender = os.getenv("EMAIL_ADDRESS", "hr@recruiting-ai.com")
        passkey = os.getenv("EMAIL_APP_PASSWORD", "")
        return await orchestrator.execute("send_notifications", {
            "selected_candidates": req.selected_candidates,
            "sender_email": sender,
            "sender_passkey": passkey,
            "company_name": "AI Inc"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
