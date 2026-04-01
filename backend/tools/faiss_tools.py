from typing import Dict, Any, List
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Warning: Could not load sentence transformer. {e}")
    embedding_model = None

def run_faiss_skill_matching(jd_skills: List[str], candidate_skills: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Returns: {jd_skill: {"score": float, "matched_skill": str}}
    """
    if not embedding_model or not jd_skills or not candidate_skills:
        scores = {}
        cand_lower = [s.lower() for s in candidate_skills]
        for js in jd_skills:
            match = js if js.lower() in cand_lower else "None"
            scores[js] = {"score": 1.0 if match != "None" else 0.0, "matched_skill": match}
        return scores

    jd_embeddings = embedding_model.encode(jd_skills)
    cand_embeddings = embedding_model.encode(candidate_skills)
    
    dimension = cand_embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    
    faiss.normalize_L2(cand_embeddings)
    faiss.normalize_L2(jd_embeddings)
    
    index.add(cand_embeddings)
    D, I = index.search(jd_embeddings, 1)
    
    match_scores = {}
    for i, jd_skill in enumerate(jd_skills):
        best_score = float(D[i][0])
        best_score = max(0.0, best_score)
        best_match_idx = int(I[i][0])
        matched_skill = candidate_skills[best_match_idx] if best_score > 0 else "None"
        match_scores[jd_skill] = {"score": best_score, "matched_skill": matched_skill}
        
    return match_scores
