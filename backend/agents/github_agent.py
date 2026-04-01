import json
from backend.tools.github_tools import fetch_github_profile
from backend.utils.cache import CacheManager

class GitHubAgentRunner:
    """Fetches GitHub profile data WITHOUT an LLM call — the REST API already returns structured data."""
    def __init__(self):
        self.cache = CacheManager()

    def fetch(self, username: str) -> dict:
        cache_key = self.cache.make_github_key(username)
        cached_val = self.cache.get(cache_key)
        if cached_val:
            return cached_val

        raw = fetch_github_profile(username)

        try:
            parsed = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            parsed = {
                "top_languages": [],
                "total_stars": 0,
                "total_forks": 0,
                "last_activity": "Unknown",
                "repo_descriptions": [],
                "recent_activity": []   # ensure field exists
            }

        # Ensure recent_activity field always present
        if "recent_activity" not in parsed:
            parsed["recent_activity"] = []

        self.cache.set(cache_key, parsed, ttl_seconds=3600)
        return parsed
