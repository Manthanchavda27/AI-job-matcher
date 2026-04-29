import re
import spacy
nlp = spacy.load("en_core_web_sm")

# ─── SKILLS LIBRARY ────────────────────────────────────────────────────────────
SKILLS_DB = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "r", "scala",
    "go", "rust", "kotlin", "swift", "php", "ruby", "matlab",

    # AI / ML
    "machine learning", "deep learning", "nlp", "natural language processing",
    "computer vision", "reinforcement learning", "transfer learning",
    "neural networks", "transformers", "bert", "gpt",

    # ML Libraries
    "tensorflow", "pytorch", "keras", "scikit-learn", "xgboost", "lightgbm",
    "huggingface", "spacy", "nltk", "opencv", "pandas", "numpy", "scipy",
    "matplotlib", "seaborn", "plotly",

    # Data / DB
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "cassandra", "firebase", "sqlite",

    # Cloud / MLOps
    "aws", "gcp", "azure", "docker", "kubernetes", "mlflow", "airflow",
    "fastapi", "flask", "django", "git", "linux",

    # Data Engineering
    "spark", "hadoop", "kafka", "dbt", "snowflake", "bigquery",

    # Analytics
    "tableau", "power bi", "excel", "google analytics",
}

# ─── NAME EXTRACTION ───────────────────────────────────────────────────────────

# Add common false positives
BLACKLIST = {
    "java", "python", "html", "css", "javascript",
    "react", "node", "sql", "mongodb"
}

def is_valid_name(name: str) -> bool:
    words = name.strip().split()

    # Rule 1: Must be 2–4 words
    if not (2 <= len(words) <= 4):
        return False

    # Rule 2: No digits or symbols
    if re.search(r"[\d@|•\-/]", name):
        return False

    # Rule 3: Not a tech keyword
    if name.lower() in BLACKLIST:
        return False

    # Rule 4: Each word starts with uppercase
    if not all(w[0].isupper() for w in words if w):
        return False

    return True


def extract_name(text: str) -> str:
    first_chunk = "\n".join(text.strip().splitlines()[:10])
    doc = nlp(first_chunk)

    # Step 1: Try NER
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = ent.text.strip()
            if is_valid_name(name):
                return name

    # Step 2: Fallback
    for line in text.strip().splitlines():
        line = line.strip()
        if is_valid_name(line):
            return line

    return "Not Found"


# ─── EMAIL ─────────────────────────────────────────────────────────────────────
def extract_email(text: str) -> str:
    match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return match.group(0) if match else "Not Found"


# ─── PHONE ─────────────────────────────────────────────────────────────────────
def extract_phone(text: str) -> str:
    match = re.search(
        r"(\+?\d{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)(\d{3}[\s\-]?\d{4})", text
    )
    return match.group(0).strip() if match else "Not Found"


# ─── LOCATION ──────────────────────────────────────────────────────────────────
def extract_location(text: str) -> str:
    first_chunk = "\n".join(text.strip().splitlines()[:15])
    doc = nlp(first_chunk)
    for ent in doc.ents:
        if ent.label_ == "GPE":
            return ent.text
    return ""


def parse_location_components(location_str: str) -> dict:
    """Split a location string into city/state/country as best as possible."""
    if not location_str or not isinstance(location_str, str):
        return {"city": "", "state": "", "country": ""}

    parts = [p.strip() for p in re.split(r"[,;/\\]", location_str) if p.strip()]

    city = ""
    state = ""
    country = ""

    if len(parts) == 1:
        country = parts[0]
    elif len(parts) == 2:
        city, country = parts
    else:
        city = parts[0]
        state = parts[-2]
        country = parts[-1]

    return {"city": city, "state": state, "country": country}


# ─── SKILLS ────────────────────────────────────────────────────────────────────
def extract_skills(text: str) -> list:
    text_lower = text.lower()
    found = set()

    # Multi-word skills first
    for skill in SKILLS_DB:
        # exact word match to avoid substring false positives like 'r' in 'your' or 'go' in 'google'
        pattern = rf"\b{re.escape(skill)}\b"
        if re.search(pattern, text_lower):
            found.add(skill)

    return sorted(list(found))


# ─── YEARS OF EXPERIENCE ───────────────────────────────────────────────────────
def extract_years_experience(text: str) -> int:
    """
    Looks for patterns like:
    - "2 years of experience"
    - "3+ years"
    - "fresher" / "fresh graduate" → 0
    - "entry level" → 0
    - finds graduation year → current_year - grad_year
    """
    text_lower = text.lower()

    # Explicit fresher signals
    if any(w in text_lower for w in 
           ["fresher", "fresh graduate", "recent graduate", 
            "no experience", "entry level", "0 years"]):
        return 0

    # Pattern: "X years" or "X+ years"
    matches = re.findall(
        r'(\d+)\s*\+?\s*years?\s*(?:of\s*)?'
        r'(?:experience|exp|work)',
        text_lower
    )
    if matches:
        return max(int(m) for m in matches)

    # Pattern: graduation year → infer experience
    grad_matches = re.findall(
        r'(?:class of|batch of|graduated|passout)\s*(\d{4})',
        text_lower
    )
    if grad_matches:
        from datetime import datetime
        grad_year = max(int(y) for y in grad_matches)
        current_year = datetime.now().year
        inferred = max(0, current_year - grad_year)
        return min(inferred, 30)  # cap at 30

    return 0  # default: treat as fresher if unknown

def extract_education(text: str) -> list:
    degrees = [
        "b.tech", "m.tech", "btech", "mtech", "b.e", "m.e",
        "bachelor", "master", "phd", "ph.d", "mba", "bsc", "msc",
        "b.sc", "m.sc", "diploma", "10th", "12th",
        "hsc", "ssc", "intermediate", "matriculation"
    ]

    found = set()  # avoid duplicates

    lines = text.splitlines()
    for line in lines:
        line_lower = line.lower()

        for deg in degrees:   # 🔥 iterate properly
            if deg in line_lower:
                found.add(deg)

    return list(found)


# ─── MASTER PARSER ─────────────────────────────────────────────────────────────
def extract_all(text: str) -> dict:
    location_raw = extract_location(text)
    location_parts = parse_location_components(location_raw)

    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "location": location_raw,
        "city": location_parts["city"],
        "state": location_parts["state"],
        "country": location_parts["country"],
        "skills": extract_skills(text),
        "years_experience": extract_years_experience(text),
        "education": extract_education(text),
    }
