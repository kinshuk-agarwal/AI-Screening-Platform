import json
from typing import Dict, Any

def robust_json_parse(text: str) -> Dict[str, Any]:
    """Helper to parse JSON even if the LLM includes markdown formatting."""
    if not text:
        return {}
    text = text.strip()
    
    # Strip markdown code blocks if present
    if "```json" in text:
        text = text.split("```json")[-1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[-1].split("```")[0]
        
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    if start_idx != -1 and end_idx != -1:
        text = text[start_idx:end_idx+1]
    
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON: {e} - Raw text: {text}")
