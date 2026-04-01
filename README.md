# AI-Based Recruitment System (v2 Orchestrator)

A highly scalable, multi-tier full-stack application for screening candidates via intelligent PhiData Agents and mathematical FAISS skill evaluations.

## Architecture

```text
User Request  --->  [ NGINX Proxy :80 ]
                          |
             +------------+-------------+
             |                          |
       [ Frontend ]              [ FastAPI Backend ] 
    (React+Vite+Tailwind)        (/api via uvicorn)
                                        |
                 +----------------------+--------------------+
                 |                      |                    |
        [ Orchestrator ]         [ FAISS Index ]       [ Redis Cache ]
                 |               (Semantic Search)     (TTL GitHub/JD)
      +----------+-----------+
      |                      |
[ PhiData Agents ]   [ GitHub API Tool ]
 (GPT-4 Analysis)     (REST Extraction)
```

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Backend Framework** | FastAPI, Uvicorn, Python 3.10 |
| **AI Workflows** | PhiData (`Agent`), OpenAI (`gpt-4o`) |
| **Vector Engine** | FAISS, Sentence Transformers (`all-MiniLM-L6-v2`) |
| **Data Extraction** | PyPDF2 (Resumes), GitHub REST API |
| **State & Caching** | Redis |
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS v3 |
| **UI Components** | Shadcn/UI references, Recharts, React-PDF |
| **DevOps** | Docker, Docker-Compose, Nginx |

## How the Mathematical Weighted Scoring Works (The Algorithm)

In v2, candidate ranking was migrated away from unpredictable LLM guessing into a rigorous, verifiable calculation.

1. **FAISS Semantic Context:** First, the `sentence-transformers` library compares the raw candidate resume skills against the Job Description requirements using Cosine Similarity up to `1.0`.
2. **LLM Proficiency Overlay:** The `SkillScoringAgent` analyzes the FAISS similarity, GitHub repository activity (commits to a given language), and Resume context to determine if a candidate's skill is `Expert`, `Intermediate`, `Beginner`, or `Missing`.
3. **Weight Mapping Formula:** 
   ```python
   Proficiency Multiplier:
   Expert = 1.0 | Intermediate = 0.7 | Beginner = 0.4 | Missing = 0.0
   
   Must Have Skills Weight = 1.0 * Provided JD Weight
   Good to Have Skills Weight = 0.4 * Provided JD Weight
   
   Final Score = sum(FAISS Score * JD Weight * Proficiency) / sum(Total Weights) * 100
   ```
4. **Ranking:** The Orchestrator forces the `ComparisonAgent` to sort candidates strictly by this resulting percentage, using the LLM exclusively to generate a natural language summary over the pre-ranked array.

## Setup Instructions (Docker)

You can launch the entire stack in 3 commands.

1. **Clone the repository**
2. **Create the environment variables:** Make a copy of `.env.example` as `.env`.
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and add your real `OPENAI_API_KEY`!*

3. **Deploy via Docker Compose:**
   Navigate into the `docker` directory and run the initialization build:
   ```bash
   cd docker
   docker compose up --build -d
   ```

The Frontend will be available at `http://localhost`, while all API endpoints natively map behind Nginx to `/api/...`.

## API Endpoint Reference

- `POST /api/analyze-jd` - Feed raw text, returns structural JSON.
- `POST /api/add-candidate` - Consumes multipart/form-data containing PDF buffer, evaluates GitHub JSON.
- `POST /api/compare-candidates` - Aggregates candidates against a JD baseline.
- `POST /api/send-emails` - Evaluates the finalized batch of `selected_candidates` and dispatches acceptance emails dynamically via standard SMTP protocols inside the PhiData EmailAgent.
- `POST /api/full-pipeline` - Takes all requirements and candidate payloads, looping through the pipeline concurrently to provide the resolved Dashboard data model in one HTTP boundary.
