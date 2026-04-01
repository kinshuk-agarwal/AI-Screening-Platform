import requests

def fetch_github_profile(username: str) -> str:
    base = "https://api.github.com"
    headers = {"Accept": "application/vnd.github+json"}

    try:
        repos_res = requests.get(
            f"{base}/users/{username}/repos"
            f"?sort=updated&per_page=100",
            headers=headers,
            timeout=10
        )
        repos_res.raise_for_status()
        repos = repos_res.json()

        total_stars = sum(
            r.get("stargazers_count", 0) for r in repos
        )
        total_forks = sum(
            r.get("forks_count", 0) for r in repos
        )

        languages = {}
        for repo in repos:
            lang = repo.get("language")
            if lang:
                languages[lang] = languages.get(lang, 0) + 1
        top_languages = [
            k for k, _ in sorted(
                languages.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
        ]

        total_repos = len(repos)
        repo_descriptions = [
            r.get("description") for r in repos
            if r.get("description")
        ][:30]

        last_activity = (
            repos[0].get("updated_at", "Unknown")[:10]
            if repos else "Unknown"
        )

        # Fetch recent public events
        events_res = requests.get(
            f"{base}/users/{username}/events/public"
            f"?per_page=30",
            headers=headers,
            timeout=10
        )

        recent_activity = []
        if events_res.ok:
            events = events_res.json()
            for event in events:
                event_type = event.get("type", "")
                if event_type not in [
                    "PushEvent",
                    "CreateEvent",
                    "PullRequestEvent",
                    "ForkEvent",
                    "WatchEvent",
                    "IssuesEvent",
                    "IssueCommentEvent",
                    "ReleaseEvent",
                    "PublicEvent",
                    "MemberEvent"
                ]:
                    continue
                repo_name = event.get(
                    "repo", {}
                ).get("name", "")
                created_at = event.get(
                    "created_at", ""
                )[:10]
                type_label = event_type.replace("Event", "")
                recent_activity.append({
                    "type": type_label,
                    "repo": repo_name,
                    "date": created_at
                })
                if len(recent_activity) >= 10:
                    break

        import json
        return json.dumps({
            "username": username,
            "total_repos": total_repos,
            "total_stars": total_stars,
            "total_forks": total_forks,
            "last_activity": last_activity,
            "top_languages": top_languages,
            "repo_descriptions": repo_descriptions,
            "recent_activity": recent_activity
        })

    except requests.RequestException as e:
        import json
        return json.dumps({
            "error": str(e),
            "username": username,
            "total_stars": 0,
            "total_forks": 0,
            "last_activity": "Unknown",
            "top_languages": [],
            "repo_descriptions": [],
            "recent_activity": []
        })
