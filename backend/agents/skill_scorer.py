from backend.utils.json_parser import robust_json_parse
import json

PROFICIENCY_MULTIPLIER = {
    "Expert": 1.0,
    "Intermediate": 0.7,
    "Beginner": 0.4,
    "Missing": 0.0
}

def _determine_proficiency(
    skill: str, 
    resume: dict, 
    github: dict
) -> str:
    skill_lower = skill.lower()

    # --- SIGNAL 1: LLM-assessed skill data from resume ---
    skills_detailed = resume.get("skills_detailed", [])
    matched_skill = None

    for s in skills_detailed:
        s_name = s.get("name", "").lower()
        # Match if skill name contains or is contained by 
        # the JD skill we are scoring
        if skill_lower in s_name or s_name in skill_lower:
            matched_skill = s
            break

    # Extract LLM signals if match found
    usage_depth = matched_skill.get(
        "usage_depth", "mentioned"
    ) if matched_skill else None
    skill_weight = matched_skill.get(
        "skill_weight", 0
    ) if matched_skill else 0

    # --- SIGNAL 2: GitHub signals ---
    top_langs = [
        l.lower() for l in github.get("top_languages", [])
    ]
    repo_descs = " ".join(
        d for d in github.get("repo_descriptions", []) if d
    ).lower()
    recent_activity = github.get("recent_activity", [])
    recent_repos = " ".join(
        e.get("repo", "") for e in recent_activity
    ).lower()
    total_stars = github.get("total_stars", 0)

    in_top_langs = skill_lower in top_langs
    in_repo_descs = skill_lower in repo_descs
    in_recent = skill_lower in recent_repos

    github_signal_count = sum([
        in_top_langs, 
        in_repo_descs, 
        in_recent
    ])

    # --- SIGNAL 3: Project-level evidence from resume ---
    projects = resume.get("projects", [])
    projects_with_skill = sum(
        1 for p in projects
        if skill_lower in str(
            p.get("skills_used", [])
        ).lower()
        or skill_lower in p.get("description", "").lower()
        or skill_lower in p.get("impact", "").lower()
    )

    # --- PROFICIENCY DECISION TREE ---

    # No evidence anywhere → Missing
    if not matched_skill \
            and github_signal_count == 0 \
            and projects_with_skill == 0:
        return "Missing"

    # EXPERT conditions (requires strong multi-source evidence)
    if matched_skill:
        if usage_depth == "primary" \
                and github_signal_count >= 2 \
                and total_stars >= 5:
            return "Expert"

        if usage_depth == "primary" \
                and github_signal_count >= 1 \
                and projects_with_skill >= 2:
            return "Expert"

        if usage_depth == "primary" \
                and skill_weight >= 8:
            return "Expert"

    # INTERMEDIATE conditions
    if matched_skill:
        if usage_depth == "primary":
            return "Intermediate"

        if usage_depth == "secondary" \
                and github_signal_count >= 1:
            return "Intermediate"

        if usage_depth == "secondary" \
                and projects_with_skill >= 2:
            return "Intermediate"

        if skill_weight >= 6 \
                and projects_with_skill >= 1:
            return "Intermediate"

    # GitHub-only intermediate (no resume match but strong GitHub)
    if github_signal_count >= 2 and total_stars >= 10:
        return "Intermediate"

    # BEGINNER conditions
    if matched_skill and usage_depth == "mentioned":
        return "Beginner"

    if matched_skill:
        return "Beginner"

    if github_signal_count >= 1:
        return "Beginner"

    if projects_with_skill >= 1:
        return "Beginner"

    return "Missing"


def calculate_weighted_score(skill_scores, jd_analysis, faiss_context):
    weighted_sum = 0
    total_weight = 0

    for skill_obj in jd_analysis.get("must_have_skills", []):
        skill = skill_obj["skill"]
        jd_weight = skill_obj["weight"]
        faiss_score = faiss_context.get(skill, {}).get("score", 0.5)
        proficiency = next((s.get("proficiency", "Missing") for s in skill_scores if s["skill"].lower() == skill.lower()), "Missing")
        multiplier = PROFICIENCY_MULTIPLIER.get(proficiency, 0.0)
        weighted_sum += faiss_score * jd_weight * multiplier
        total_weight += jd_weight

    for skill_obj in jd_analysis.get("good_to_have_skills", []):
        skill = skill_obj["skill"]
        jd_weight = skill_obj["weight"] * 0.4
        faiss_score = faiss_context.get(skill, {}).get("score", 0.5)
        proficiency = next((s.get("proficiency", "Missing") for s in skill_scores if s["skill"].lower() == skill.lower()), "Missing")
        multiplier = PROFICIENCY_MULTIPLIER.get(proficiency, 0.0)
        weighted_sum += faiss_score * jd_weight * multiplier
        total_weight += jd_weight

    if total_weight == 0:
        return 0
    return round((weighted_sum / total_weight) * 100, 1)


class SkillScorerRunner:
    """Pure math scoring — no LLM call required."""

    def score(self, candidate_profile: dict, jd_analysis: dict, faiss_context: dict) -> dict:
        resume = candidate_profile.get("resume", {})
        github = candidate_profile.get("github", {})

        # Build skill_scores deterministically
        all_skills = (
            [s["skill"] for s in jd_analysis.get("must_have_skills", [])] +
            [s["skill"] for s in jd_analysis.get("good_to_have_skills", [])]
        )

        skill_scores = []
        for skill in all_skills:
            proficiency = _determine_proficiency(skill, resume, github)
            faiss_score = faiss_context.get(skill, {}).get("score", 0.0)
            skill_scores.append({
                "skill": skill,
                "proficiency": proficiency,
                "faiss_score": round(faiss_score, 3)
            })

        weighted_score = calculate_weighted_score(skill_scores, jd_analysis, faiss_context)

        return {
            "skill_scores": skill_scores,
            "weighted_score": weighted_score,
            "github_stats": {
                "total_repos": github.get("total_repos", 0),
                "total_stars": github.get("total_stars", 0),
                "total_forks": github.get("total_forks", 0),
                "last_activity": github.get("last_activity", "Unknown"),
                "top_languages": github.get("top_languages", []),
                "recent_activity": github.get("recent_activity", [])
            }
        }
