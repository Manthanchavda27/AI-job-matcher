import os
import pdfplumber
from docx import Document
from utils import extract_all


def parse_resume(file_path: str) -> dict:
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        raw_text = _extract_pdf(file_path)
    elif ext == ".docx":
        raw_text = _extract_docx(file_path)
    else:
        raise ValueError("Only .pdf and .docx supported")

    # Extract structured fields from raw text
    structured = extract_all(raw_text)
    structured["raw_text"] = raw_text  # keep raw text for embedding later

    return structured


def _extract_pdf(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception:
        from pdfminer.high_level import extract_text
        text = extract_text(file_path) or ""
    return text


def _extract_docx(file_path: str) -> str:
    doc = Document(file_path)
    return "\n".join([p.text for p in doc.paragraphs if p.text])