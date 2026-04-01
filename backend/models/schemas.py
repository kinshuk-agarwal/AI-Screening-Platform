from pydantic import BaseModel
from typing import List, Dict, Any

class JDRequest(BaseModel):
    text: str

class CompareCandidatesRequest(BaseModel):
    candidates: List[Dict[str, Any]]
    jd_analysis: Dict[str, Any]

class EmailRequest(BaseModel):
    selected_candidates: List[Dict[str, str]]
