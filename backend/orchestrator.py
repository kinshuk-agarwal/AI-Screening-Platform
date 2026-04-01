import asyncio
from backend.agents.jd_analyzer import JDAnalyzerRunner
from backend.agents.resume_parser import ResumeParserRunner
from backend.agents.github_agent import GitHubAgentRunner
from backend.agents.skill_scorer import SkillScorerRunner
from backend.agents.comparison_agent import ComparisonAgentRunner
from backend.agents.email_agent import EmailAgentRunner
import hashlib
from backend.utils.cache import CacheManager
from backend.tools.faiss_tools import run_faiss_skill_matching

class RecruitmentOrchestrator:
    def __init__(self):
        self._jd_analyzer = None
        self._resume_parser = None
        self._github_agent = None
        self._skill_scorer = None
        self._comparison_agent = None
        self._cache = CacheManager()

    @property
    def jd_analyzer(self):
        if not self._jd_analyzer:
            self._jd_analyzer = JDAnalyzerRunner()
        return self._jd_analyzer

    @property
    def resume_parser(self):
        if not self._resume_parser:
            self._resume_parser = ResumeParserRunner()
        return self._resume_parser

    @property
    def github_agent(self):
        if not self._github_agent:
            self._github_agent = GitHubAgentRunner()
        return self._github_agent

    @property
    def skill_scorer(self):
        if not self._skill_scorer:
            self._skill_scorer = SkillScorerRunner()
        return self._skill_scorer

    @property
    def comparison_agent(self):
        if not self._comparison_agent:
            self._comparison_agent = ComparisonAgentRunner()
        return self._comparison_agent
        
    async def execute(self, task: str, payload: dict) -> dict:
        if task == "analyze_jd":
            text = payload["text"]
            jd_hash = hashlib.md5(text.encode()).hexdigest()
            cache_key = f"jd:{jd_hash}"
            
            # Check cache first
            cached = self._cache.get(cache_key)
            if cached:
                print("[Orchestrator] JD cache hit — skipping Gemini call")
                return cached
            
            # Call LLM only if not cached
            result = await self._run_with_retry(
                self.jd_analyzer.analyze, text
            )
            
            # Cache for 24 hours
            self._cache.set(cache_key, result, ttl_seconds=86400)
            return result

        elif task == "process_candidate":
            return await self._process_candidate_pipeline(payload)
        elif task == "compare_and_rank":
            return await self._run_with_retry(self.comparison_agent.compare, payload["candidates"], payload["jd_analysis"])
        elif task == "send_notifications":
            runner = EmailAgentRunner(
                sender_email=payload.get("sender_email"),
                sender_passkey=payload.get("sender_passkey"),
                company_name=payload.get("company_name", "AI Recruiting Team")
            )
            for c in payload.get("selected_candidates", []):
                await asyncio.to_thread(runner.notify, c)
            return {"status": "success"}
        else:
            raise ValueError(f"Unknown task: {task}")
            
    async def _run_with_retry(self, func, *args, **kwargs):
        retries = 3
        last_err = None
        
        for attempt in range(retries + 1):
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return await asyncio.to_thread(
                        func, *args, **kwargs
                    )
            except Exception as e:
                last_err = e
                err_str = str(e)
                
                is_rate_limit = (
                    "429" in err_str or 
                    "quota" in err_str.lower() or 
                    "rate" in err_str.lower() or
                    "resource_exhausted" in err_str.lower()
                )
                
                if is_rate_limit and attempt < retries:
                    # Exponential backoff capped at 60s
                    wait = min(15 * (2 ** attempt), 60)
                    print(
                        f"[Orchestrator] Rate limit hit. "
                        f"Waiting {wait}s "
                        f"(attempt {attempt+1}/{retries})..."
                    )
                    await asyncio.sleep(wait)
                else:
                    raise
        
        raise last_err

    async def _gemini_delay(self):
        """Add small delay between Gemini calls to avoid hitting rate limits."""
        await asyncio.sleep(3)
        
    async def _process_candidate_pipeline(self, payload: dict) -> dict:
        try:
            return await asyncio.wait_for(
                self._process_candidate_pipeline_inner(payload),
                timeout=120.0
            )
        except asyncio.TimeoutError:
            raise ValueError(
                f"Candidate {payload.get('name')} processing timed out after 120 seconds"
            )

    async def _process_candidate_pipeline_inner(self, payload: dict) -> dict:
        jd_analysis = payload["jd_analysis"]
        
        pdf_text = payload["pdf_text"]
        if len(pdf_text) > 15000:
            print(f"[Orchestrator] Truncating PDF text from {len(pdf_text)} to 15000 chars")
            pdf_text = pdf_text[:15000]
        
        resume_hash = hashlib.md5(pdf_text.encode()).hexdigest()
        resume_cache_key = f"resume:{resume_hash}"
        
        cached_resume = self._cache.get(resume_cache_key)
        if cached_resume:
            print(f"[Orchestrator] Resume cache hit for {payload.get('name')}")
            resume_data = cached_resume
            github_data = await asyncio.to_thread(
                self.github_agent.fetch, 
                payload["github_username"]
            )
        else:
            resume_data, github_data = await asyncio.gather(
                self._run_with_retry(
                    self.resume_parser.parse, pdf_text
                ),
                asyncio.to_thread(
                    self.github_agent.fetch, 
                    payload["github_username"]
                )
            )
            # Cache resume parse for 1 hour
            self._cache.set(
                resume_cache_key, 
                resume_data, 
                ttl_seconds=3600
            )

        # After resume_data is obtained:
        await self._gemini_delay()

        
        jd_skills = []
        for sk in jd_analysis.get("must_have_skills", []) + jd_analysis.get("good_to_have_skills", []):
            if sk.get("skill"):
                jd_skills.append(sk["skill"])
        
        cand_skills = resume_data.get("skills", [])
        faiss_context = await asyncio.to_thread(run_faiss_skill_matching, jd_skills, cand_skills)
        
        cand_profile = {
            "name": payload.get("name"),
            "github_username": payload.get("github_username"),
            "resume": resume_data,
            "github": github_data
        }
        
        score_data = await asyncio.to_thread(self.skill_scorer.score, cand_profile, jd_analysis, faiss_context)
        
        cand_profile.update(score_data)
        return cand_profile
