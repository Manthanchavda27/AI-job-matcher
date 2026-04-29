from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel  # ✅ THIS WAS MISSING
import os
import uuid

from parser import parse_resume
from recommender import get_recommendations
from resume_scorer import score_resume

app = FastAPI()

UPLOAD_DIR = "../backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── /parse ───────────────────────────────────────────────────────────────────
@app.post("/parse")
async def parse_resume_api(file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(file.filename)[-1] if file.filename else ".pdf"
        safe_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        print("File saved:", file_path)
        parsed_data = parse_resume(file_path)
        resume_score = score_resume(parsed_data)

        return {"parsedData": parsed_data, "resumeScore": resume_score}

    except Exception as e:
        print("PARSE ERROR:", str(e))
        return {"error": str(e)}


# ─── /recommend ───────────────────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    parsed_resume: dict
    # No page/page_size — new recommender handles everything internally


@app.post("/recommend")
async def recommend_jobs(body: RecommendRequest):
    try:
        # New recommender.py: get_recommendations(parsed_resume) only
        result = get_recommendations(parsed_resume=body.parsed_resume)
        return result

    except Exception as e:
        print("RECOMMEND ERROR:", str(e))
        return {"error": str(e), "top5": [], "all_jobs": [], "by_location": {}}