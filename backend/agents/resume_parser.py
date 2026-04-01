import os
import google.generativeai as genai
from dotenv import load_dotenv
from backend.utils.json_parser import robust_json_parse

load_dotenv(override=True)
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

SYSTEM_PROMPT = """You are a senior technical recruiter and 
engineering manager with deep expertise across all areas of 
software engineering, AI/ML, data engineering, and DevOps.

You are given a raw resume text. Your job is to deeply 
analyze it and extract a rich structured profile.

You must use your own expert judgment to:

1. IDENTIFY skills — do not use any predefined list.
   Read the resume like a human expert would. Extract skills
   from project descriptions, bullet points, certifications,
   tools mentioned, and IMPLIED technologies.

   Examples of implied skill detection:
   - "built RAG pipeline" → RAG, Vector Databases, Embeddings
   - "deployed on OCI" → Oracle Cloud Infrastructure
   - "used sentence transformers" → HuggingFace, Embeddings
   - "async REST APIs" → FastAPI, Async Programming
   - "MCP for tool invocation" → Model Context Protocol, Agentic AI
   - "ETL orchestration" → Data Pipelines, Workflow Orchestration
   - "JWT authentication" → Authentication, Security
   - "role-based access control" → Authorization, Backend Security
   - "KMeans clustering" → Unsupervised ML, Scikit-learn
   - "containerized backend" → Docker, DevOps
   Never miss a skill just because it is phrased indirectly.
   Never limit yourself to a known list.

2. DETERMINE skill type for each skill:
   - "language" → Python, TypeScript, SQL, C++
   - "framework" → FastAPI, React, LangChain, PhiData
   - "concept" → RAG, MCP, Semantic Search, ETL, CI/CD, RBAC
   - "tool" → Docker, Git, FAISS, Tableau, Power BI
   - "platform" → AWS, GCP, OCI, Azure, Redis
   - "database" → PostgreSQL, MongoDB, SQLite, FAISS
   Use your judgment — these are guidelines not strict rules.

3. INFER usage_depth for each skill:
   - "primary" = used as main technology across multiple 
     projects or jobs. Candidate clearly owns this skill.
   - "secondary" = used as a supporting tool in at least 
     one project. Candidate has real hands-on exposure.
   - "mentioned" = referenced once, in passing, or only 
     listed in a skills section with no project evidence.

4. CALCULATE skill_weight from 1-10 based on:
   - Frequency: how many times does it appear across resume
   - Context: job experience carries more weight than projects
   - Depth: enterprise/production usage weighs more
   - Certification: explicitly certified skills get +2
   - Recency: recent usage weighs more than old usage
   Scale: 1-3 = weak signal, 4-6 = moderate, 7-10 = strong

5. PROVIDE evidence for each skill:
   One sentence explaining exactly where in the resume 
   this skill was identified and why you assigned that 
   usage_depth and weight. This must be specific — 
   not generic like "found in skills section".

6. EXTRACT projects with full detail:
   For each project listed on the resume:
   - Extract the exact project name
   - List every skill used in that specific project
   - Write a one sentence summary
   - Extract any measurable impact (numbers, percentages, 
     scale metrics like "10,000+ documents")

7. ESTIMATE experience_years honestly:
   - Count each 6-month internship as 0.5 years
   - Count each full-time year as 1.0
   - Do not round up aggressively
   - Final year students with internships: typically 0.5-1.5

8. WRITE a candidate summary:
   2 sentences from the perspective of an engineering manager.
   First sentence: overall technical profile.
   Second sentence: strongest area and standout differentiator.

Return EXACTLY this JSON structure.
No markdown ticks. No extra text. Only the JSON object:

{
  "skills": [
    {
      "name": "string",
      "type": "language|framework|concept|tool|platform|database",
      "usage_depth": "primary|secondary|mentioned",
      "skill_weight": int,
      "evidence": "string"
    }
  ],
  "experience_years": float,
  "education": "string",
  "projects": [
    {
      "name": "string",
      "skills_used": ["array of skill name strings"],
      "description": "string",
      "impact": "string"
    }
  ],
  "summary": "string"
}

Be exhaustive. A strong technical resume should yield 
15-30 skills. Do not truncate the skills array.
Do not use a predefined skill list under any circumstances.
Use only what you read and infer from the resume text."""

class ResumeParserRunner:
    def __init__(self):
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )

    def parse(self, text: str) -> dict:
        if not text or len(text.strip()) < 50:
            return {
                "skills": [],
                "skills_detailed": [],
                "experience_years": 0,
                "education": "Not specified",
                "projects": [],
                "summary": ""
            }

        # Truncate aggressively to limit token burn and 429 rate limits
        if len(text) > 20000:
            text = text[:20000]

        try:
            response = self.model.generate_content(
                f"Deeply analyze this resume and extract the "
                f"complete structured profile. Be exhaustive "
                f"with skill detection — use context and "
                f"inference, not a keyword list:\n\n{text}"
            )
        except Exception as e:
            print(f"[ResumeParser] Primary parse failed: {e}")
            return {
                "skills": [],
                "skills_detailed": [],
                "experience_years": 0,
                "education": "Error during analysis",
                "projects": [],
                "summary": "Analysis failed due to API error."
            }

        try:
            parsed = robust_json_parse(response.text)
        except Exception:
            parsed = {}

        # Retry if skills completely missing or empty
        if not parsed.get("skills"):
            retry_response = self.model.generate_content(
                f"The previous parse returned empty skills. "
                f"Re-analyze this resume carefully. Extract "
                f"ALL technical skills including implied ones. "
                f"Return the complete JSON structure with "
                f"skills array populated:\n\n{text}"
            )
            try:
                parsed = robust_json_parse(retry_response.text)
            except Exception:
                parsed = {}

        # Normalize for downstream FAISS compatibility
        # Keep rich data in skills_detailed
        # Keep flat name list in skills
        raw_skills = parsed.get("skills", [])

        if raw_skills and isinstance(raw_skills[0], dict):
            parsed["skills_detailed"] = raw_skills
            parsed["skills"] = [
                s.get("name", "") for s in raw_skills
                if s.get("name")
            ]
        elif raw_skills and isinstance(raw_skills[0], str):
            # Already flat strings — wrap into minimal objects
            parsed["skills_detailed"] = [
                {
                    "name": s,
                    "type": "unknown",
                    "usage_depth": "mentioned",
                    "skill_weight": 3,
                    "evidence": "Extracted from resume text"
                }
                for s in raw_skills
            ]
            parsed["skills"] = raw_skills

        return parsed
