import sqlite3
import json
import uuid
import os
from backend.core.config import settings

def get_db_connection():
    # Use absolute path resolving relative to cwd to avoid confusion
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.executescript('''
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            jd_text TEXT NOT NULL,
            jd_analysis_json TEXT,
            comparison_summary_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            github_username TEXT,
            pdf_text TEXT,
            status TEXT NOT NULL,
            resume_data_json TEXT,
            github_data_json TEXT,
            score_data_json TEXT,
            error_msg TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES jobs(job_id)
        );
    ''')
    conn.commit()
    conn.close()

# Job Functions
def create_job(jd_text: str) -> str:
    job_id = str(uuid.uuid4())
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO jobs (job_id, status, jd_text) VALUES (?, ?, ?)",
        (job_id, "pending", jd_text)
    )
    conn.commit()
    conn.close()
    return job_id

def update_job(job_id: str, status: str = None, jd_analysis: dict = None, comparison_summary: dict = None):
    conn = get_db_connection()
    c = conn.cursor()
    
    query = "UPDATE jobs SET updated_at = CURRENT_TIMESTAMP"
    params = []
    
    if status is not None:
        query += ", status = ?"
        params.append(status)
    if jd_analysis is not None:
        query += ", jd_analysis_json = ?"
        params.append(json.dumps(jd_analysis))
    if comparison_summary is not None:
        query += ", comparison_summary_json = ?"
        params.append(json.dumps(comparison_summary))
        
    query += " WHERE job_id = ?"
    params.append(job_id)
    
    c.execute(query, tuple(params))
    conn.commit()
    conn.close()

def get_job(job_id: str) -> dict:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return None
        
    return {
        "job_id": row["job_id"],
        "status": row["status"],
        "jd_text": row["jd_text"],
        "jd_analysis": json.loads(row["jd_analysis_json"]) if row["jd_analysis_json"] else None,
        "comparison_summary": json.loads(row["comparison_summary_json"]) if row["comparison_summary_json"] else None,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"]
    }

# Candidate Functions
def add_candidate(job_id: str, name: str, email: str, github_username: str, pdf_text: str) -> str:
    cand_id = str(uuid.uuid4())
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO candidates (id, job_id, name, email, github_username, pdf_text, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (cand_id, job_id, name, email, github_username, pdf_text, "pending")
    )
    conn.commit()
    conn.close()
    return cand_id

def update_candidate(cand_id: str, status: str = None, resume_data: dict = None, github_data: dict = None, score_data: dict = None, error_msg: str = None):
    conn = get_db_connection()
    c = conn.cursor()
    
    query = "UPDATE candidates SET updated_at = CURRENT_TIMESTAMP"
    params = []
    
    if status is not None:
        query += ", status = ?"
        params.append(status)
    if resume_data is not None:
        query += ", resume_data_json = ?"
        params.append(json.dumps(resume_data))
    if github_data is not None:
        query += ", github_data_json = ?"
        params.append(json.dumps(github_data))
    if score_data is not None:
        query += ", score_data_json = ?"
        params.append(json.dumps(score_data))
    if error_msg is not None:
        query += ", error_msg = ?"
        params.append(error_msg)
        
    query += " WHERE id = ?"
    params.append(cand_id)
    
    c.execute(query, tuple(params))
    conn.commit()
    conn.close()

def get_job_candidates(job_id: str) -> list:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM candidates WHERE job_id = ? ORDER BY created_at ASC", (job_id,))
    rows = c.fetchall()
    conn.close()
    
    candidates = []
    for r in rows:
        candidates.append({
            "id": r["id"],
            "job_id": r["job_id"],
            "name": r["name"],
            "email": r["email"],
            "github_username": r["github_username"],
            "pdf_text": r["pdf_text"],
            "status": r["status"],
            "resume_data": json.loads(r["resume_data_json"]) if r["resume_data_json"] else None,
            "github_data": json.loads(r["github_data_json"]) if r["github_data_json"] else None,
            "score_data": json.loads(r["score_data_json"]) if r["score_data_json"] else None,
            "error_msg": r["error_msg"]
        })
    return candidates

# Run init immediately on import
init_db()
