import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from backend.utils.json_parser import robust_json_parse

load_dotenv(override=True)
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

SYSTEM_PROMPT = """You are a hiring manager comparing scored candidates.
You will receive a list of all scored candidate profiles and the JD analysis.
Compare them to identify the best fit and differentiators.
Return EXACTLY a JSON object with:
- summary: A transition-grade, world-class markdown comparison summary. 
    1. EXCLUSIVES: Include a 'Key Metrics Overview' table at the top comparing: Experience, Overall Score, Total GitHub Repos, Top Languages, and primary Cloud/DB stacks.
    2. ANALYSIS: Provide a 'Strategic Performance' section with side-by-side pros/cons.
    3. VERDICT: A clear 'Executive Verdict' on the best fit.
    Use bold headers, clean tables, and bullet points. Ensure the layout is 'breathable' and fits a professional hiring dashboard.
No markdown ticks in the response."""

def re_rank_candidates(candidates):
    return sorted(
        candidates,
        key=lambda x: x.get("weighted_score", 0),
        reverse=True
    )

class ComparisonAgentRunner:
    def __init__(self):
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )

    def compare(self, candidates: list, jd_analysis: dict) -> dict:
        prompt = f"Candidates subset: {json.dumps(candidates, default=str)}\nJD context: {json.dumps(jd_analysis, default=str)}\n\nCompare and provide summary in JSON exactly."
        response = self.model.generate_content(prompt)
        parsed = robust_json_parse(response.text)

        ranked_candidates = re_rank_candidates(candidates)

        return {
            "ranked_candidates": ranked_candidates,
            "summary": parsed.get("summary", "Summary unavailable.")
        }
