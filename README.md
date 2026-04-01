# AI Recruitment System 🚀

## Project Description 📝

This project is an **AI Recruitment System** designed to accelerate the hiring process for HR and technical recruiters. The application allows recruiters to:

1. 📄 Upload candidate resumes, job descriptions, job roles, and additional evaluation instructions.
2. 🤖 Evaluate resumes using AI.
3. ✉️ Automatically send email notifications to candidates with feedback, indicating whether they are selected or rejected.
4. 📅 Schedule Zoom meetings for the next day as an initial round of interviews.

This system significantly streamlines the recruitment process by selecting the most suitable candidates and providing immediate feedback to candidates on areas for improvement.

---

## Prerequisites ⚙️

To configure this application, the following credentials and accounts are required:

### API Keys for LLM Models 🔑:
- Obtain API keys from the official websites of **Mistral**, **Claude**, or **OpenAI**.

### Gmail Account for Email Notifications 📧:
1. Create or use an existing Gmail account for the recruiter.
2. Enable **2-Step Verification** and generate an **App Password**.
   - The app password is a 16-digit code generated through **[Google App Password](https://support.google.com/accounts/answer/185833)**.
   - Format: `afec wejf awoj fwrv` (use without spaces in the Streamlit app).

## Installation 🛠️

### Run Locally 💻

1. Clone this repository:
   ```bash
   git clone https://github.com/manthan89-py/AI-Based-Recruitment-System.git
   ```

2. Ensure Python (version >= 3.10) is installed.

3. Install the UV package manager:
   ```bash
   pip install uv
   ```

4. Navigate to the cloned repository:
   ```bash
   cd AI-Based-Recruitment-System
   ```

5. Create a new virtual environment:
   ```bash
   uv venv --python 3.10
   ```

6. Activate the environment:
   - On Linux/MacOS:
     ```bash
     source .venv/bin/activate
     ```
   - On Windows:
     ```bash
     .venv\Scripts\activate
     ```

7. Install dependencies:
   ```bash
   uv install
   ```

8. Run the application:
   ```bash
   streamlit run app.py
   ```

### Run with Docker 🐳

#### Build Locally 🏗️
1. Build the Docker image:
   ```bash
   docker build -t localmachine/ai_recruitment_team:main-latest .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 7860:7860 localmachine/ai_recruitment_team:main-latest
   ```

#### Use Prebuilt Image 📦
1. Pull the prebuilt image from DockerHub:
   ```bash
   docker pull manthan07/ai_recruitment_team:main-latest
   ```

2. Run the Docker container:
   ```bash
   docker run -p 7860:7860 manthan07/ai_recruitment_team:main-latest
   ```

---

## Technologies Used 🛠️

- **PhiData:** Agents (Resume Analyzer Agent, Email Agent, Scheduler Agent) and Tools (ZoomTool)
- **Python** 🐍
- **Pydantic** 📋
- **PyPDF2** 📄
- **Streamlit** 🌐

---
