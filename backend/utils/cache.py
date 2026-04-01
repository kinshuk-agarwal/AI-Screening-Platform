import os
import json
import time
from typing import Optional, Dict, Any

class CacheManager:
    def __init__(self):
        self.cache_file = os.getenv("CACHE_FILE_PATH", "./local_cache.json")
        self._enabled = True
        self._cache = self._load()

    def _load(self):
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save(self):
        try:
            with open(self.cache_file, "w") as f:
                json.dump(self._cache, f)
        except Exception as e:
            print(f"Error saving cache: {e}")

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        if not self._enabled or key not in self._cache:
            return None
        
        entry = self._cache[key]
        if time.time() > entry["expires_at"]:
            del self._cache[key]
            self._save()
            return None
            
        return entry["data"]

    def set(self, key: str, value: Dict[str, Any], ttl_seconds: int = 86400):
        if not self._enabled:
            return
        self._cache[key] = {
            "data": value,
            "expires_at": time.time() + ttl_seconds
        }
        self._save()
