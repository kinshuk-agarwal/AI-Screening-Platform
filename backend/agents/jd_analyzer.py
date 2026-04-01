import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from backend.utils.json_parser import robust_json_parse

load_dotenv(override=True)
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

SYSTEM_PROMPT = """You are an expert HR analyst who parses unstructured Job Descriptions.
Extract the following details from the JD text and return EXACTLY this JSON structure:
{
  "role": "The specific job title",
  "seniority": "Junior, Mid, Senior, Lead, etc.",
  "must_have_skills": [{"skill": "skill_name", "weight": 8}],
  "good_to_have_skills": [{"skill": "skill_name", "weight": 5}],
  "deal_breaker_skills": [{"skill": "skill_name"}],
  "reasoning_weights": "Explain why these weights were chosen",
  "role_signals": "string keywords indicating domain (e.g. backend, frontend, ML, data)"
}
Do not write anything else. Return only valid JSON."""

class JDAnalyzerRunner:
    def __init__(self):
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )

    def analyze(self, text: str) -> dict:
        response = self.model.generate_content(
            f"Please extract the following job description into JSON format:\n\n{text}"
        )
        parsed = robust_json_parse(response.text)

        if "role" not in parsed or "must_have_skills" not in parsed:
            raise ValueError("JD Analysis failed validation: missing 'role' or 'must_have_skills'")

        return parsed
