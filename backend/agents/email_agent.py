import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv(override=True)

class EmailAgentRunner:
    """Sends email notifications without LLM — uses a simple template."""
    def __init__(self, sender_email: str, sender_passkey: str, company_name: str = "AI Recruiting Team"):
        self.sender_email = sender_email or os.environ.get("EMAIL_ADDRESS", "")
        self.sender_passkey = sender_passkey or os.environ.get("EMAIL_APP_PASSWORD", "")
        self.company_name = company_name

    def notify(self, candidate: dict) -> dict:
        name = candidate.get("name", "Candidate")
        score = candidate.get("weighted_score", 0)
        email = candidate.get("email", "")

        if not email:
            return {"status": "skipped", "reason": "no email provided"}

        subject = f"Interview Invitation from {self.company_name}"
        body = f"""Dear {name},

We are pleased to inform you that after careful review of your profile (Score: {score}%),
we would like to invite you for the next round of our hiring process.

Please reply to this email to confirm your availability.

Best regards,
{self.company_name}
"""
        try:
            msg = MIMEMultipart()
            msg["From"] = self.sender_email
            msg["To"] = email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_passkey)
                server.send_message(msg)

            return {"status": "sent", "to": email}
        except Exception as e:
            return {"status": "failed", "error": str(e)}
