import google.generativeai as genai
from app.core.config import settings

def main():
    if not settings.GEMINI_API_KEY:
        print("GEMINI_API_KEY is not set in environment / .env")
        return

    genai.configure(api_key=settings.GEMINI_API_KEY)

    print("Listing models available for this API key:\n")
    for m in genai.list_models():
        # Only show models that support text generation
        if "generateContent" in getattr(m, "supported_generation_methods", []):
            print("-", m.name)

if __name__ == "__main__":
    main()
