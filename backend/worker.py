import asyncio
import traceback
from backend.core.config import settings
from backend.db.database import get_job, get_job_candidates, update_job, update_candidate
from backend.orchestrator import RecruitmentOrchestrator

queue = asyncio.Queue()
semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_LLM)
orchestrator = RecruitmentOrchestrator()

async def worker_loop():
    print(f"[Worker] Started with Concurrency limit: {settings.MAX_CONCURRENT_LLM}")
    while True:
        try:
            task = await queue.get()
            if task["type"] == "process_job":
                await handle_job(task["job_id"])
            queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as e:
            traceback.print_exc()

async def handle_job(job_id: str):
    job = get_job(job_id)
    if not job:
        print(f"[Worker] Job {job_id} not found.")
        return
        
    print(f"[Worker] Processing Job: {job_id}...")
    update_job(job_id, status="processing")
    
    # 1. Analyze JD
    try:
        jd_analysis = await orchestrator.execute("analyze_jd", {"text": job["jd_text"]})
        update_job(job_id, jd_analysis=jd_analysis)
    except Exception as e:
        traceback.print_exc()
        update_job(job_id, status="failed")
        return
        
    # 2. Process Candidates
    candidates = get_job_candidates(job_id)
    print(f"[Worker] Found {len(candidates)} candidates for Job {job_id}")
    
    async def process_cand_with_semaphore(cand):
        update_candidate(cand["id"], status="processing")
        try:
            async with semaphore:
                print(f"[Worker] Processing candidate {cand['name']}...")
                payload = {
                    "name": cand["name"],
                    "github_username": cand["github_username"],
                    "email": cand["email"],
                    "pdf_text": cand["pdf_text"],
                    "jd_analysis": jd_analysis
                }
                
                result = await orchestrator.execute("process_candidate", payload)
                
                # Ensure we capture score_data (everything not resume/github/etc)
                score_data = {
                    k: v for k, v in result.items() 
                    if k not in ["resume", "github", "name", "github_username", "email"]
                }
                
                update_candidate(
                    cand["id"], 
                    status="scored", 
                    resume_data=result.get("resume"),
                    github_data=result.get("github"),
                    score_data=score_data
                )
                print(f"[Worker] Candidate {cand['name']} scored successfully.")
        except Exception as e:
            traceback.print_exc()
            update_candidate(cand["id"], status="failed", error_msg=str(e))
    
    # We await all candidates processing concurrently (bounded by semaphore)
    await asyncio.gather(*(process_cand_with_semaphore(c) for c in candidates))
    
    # 3. Compare & Rank
    updated_cands = get_job_candidates(job_id)
    scored_cands = [c for c in updated_cands if c["status"] == "scored"]
    
    if len(scored_cands) > 1:
        print(f"[Worker] Generating comparison for {len(scored_cands)} candidates...")
        packed_candidates = []
        for sc in scored_cands:
            c_dict = {
                "name": sc["name"],
                "github_username": sc["github_username"],
                "original_profile": {
                    "github_username": sc["github_username"],
                    "email": sc["email"],
                }
            }
            if sc["score_data"]:
                c_dict.update(sc["score_data"])
            packed_candidates.append(c_dict)
            
        try:
            async with semaphore:
                comparison = await orchestrator.execute("compare_and_rank", {
                    "candidates": packed_candidates,
                    "jd_analysis": jd_analysis
                })
                update_job(job_id, comparison_summary=comparison)
                print("[Worker] Comparison generated.")
        except Exception as e:
            traceback.print_exc()
            print("[Worker] Comparison failed.")
            
    update_job(job_id, status="completed")
    print(f"[Worker] Job {job_id} fully completed.")

def enqueue_job(job_id: str):
    queue.put_nowait({"type": "process_job", "job_id": job_id})
