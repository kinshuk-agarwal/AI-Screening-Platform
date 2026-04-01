import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(override=True)
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

print("Testing gemini-2.5-flash...")
model = genai.GenerativeModel("gemini-2.5-flash")
try:
    response = model.generate_content("Say exactly: WORKING")
    print(f"SUCCESS: {response.text.strip()}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
