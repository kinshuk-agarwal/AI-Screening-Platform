import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(override=True)
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash-latest")
try:
    response = model.generate_content("hello")
    print("SUCCESS", response.text)
except Exception as e:
    with open("error.log", "w") as f:
        f.write(str(type(e)) + "\n" + str(e))
