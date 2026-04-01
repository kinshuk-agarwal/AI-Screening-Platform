import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(override=True)
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")
try:
    response = model.generate_content("hello")
    print("SUCCESS", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
