import os
import requests
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from model import predict_role
from skill_suggestions import get_skill_suggestions

# ─── LOAD ENV ──────────────────────────────────────────────────────────────────
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
THEIRSTACK_KEY = os.getenv("THEIRSTACK_API_KEY")
THEIRSTACK_URL = "https://api.theirstack.com/v1/jobs/search"

# ─── LOAD EMBEDDING MODEL ONCE AT STARTUP ──────────────────────────────────────
print("Loading sentence transformer...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
print("Sentence transformer ready.")

# ─── ROLE TO RELATED TITLES MAPPING ───────────────────────────────────────────
# For each predicted role, we search using 3 related job titles
# This gives us variety in the 30 jobs fetched
ROLE_TITLES_MAP = {
    "AI/ML Engineer": [
        "Machine Learning Engineer",
        "AI Engineer",
        "NLP Engineer"
    ],
    "Data Analyst/Engineer": [
        "Data Analyst",
        "Data Engineer",
        "Business Intelligence Analyst"
    ],
    "Frontend Developer": [
        "Frontend Developer",
        "React Developer",
        "UI Developer"
    ],
    "Full Stack Developer": [
        "Full Stack Developer",
        "Web Developer",
        "Software Developer"
    ],
    "Backend Developer": [
        "Backend Developer",
        "Software Engineer",
        "Python Developer"
    ],
    "DevOps/Cloud Engineer": [
        "DevOps Engineer",
        "Cloud Engineer",
        "Site Reliability Engineer"
    ],
    "Mobile Developer": [
        "Mobile Developer",
        "Android Developer",
        "iOS Developer"
    ],
    "Security Engineer": [
        "Security Engineer",
        "Cybersecurity Analyst",
        "Information Security Engineer"
    ],
    "QA Engineer": [
        "QA Engineer",
        "Software Tester",
        "Quality Assurance Engineer"
    ],
    "UX/UI Designer": [
        "UX Designer",
        "UI Designer",
        "Product Designer"
    ],
    "Product/Project Manager": [
        "Product Manager",
        "Project Manager",
        "Scrum Master"
    ],
    "Marketing Specialist": [
        "Digital Marketing Specialist",
        "SEO Specialist",
        "Content Marketing Manager"
    ],
    "Finance Specialist": [
        "Financial Analyst",
        "Investment Analyst",
        "Accounting Manager"
    ],
    "HR Specialist": [
        "HR Manager",
        "Talent Acquisition Specialist",
        "Human Resources Generalist"
    ],
    "Sales Specialist": [
        "Sales Manager",
        "Business Development Manager",
        "Account Executive"
    ],
    "Legal Specialist": [
        "Legal Counsel",
        "Corporate Lawyer",
        "Paralegal"
    ],
    "Healthcare Professional": [
        "Registered Nurse",
        "Physician Assistant",
        "Medical Officer"
    ],
    "Educator": [
        "Teacher",
        "Corporate Trainer",
        "Curriculum Developer"
    ],
    "Operations Specialist": [
        "Operations Manager",
        "Supply Chain Analyst",
        "Logistics Manager"
    ],
    "Other": [
        "General Manager",
        "Business Analyst",
        "Operations Coordinator"
    ],
}

COUNTRY_NAME_TO_CODE = {
    "india": "IN",
    "united states": "US",
    "usa": "US",
    "united kingdom": "GB",
    "uk": "GB",
    "canada": "CA",
    "australia": "AU",
    "germany": "DE",
    "france": "FR",
    "japan": "JP",
    "china": "CN",
    "singapore": "SG",
    "united arab emirates": "AE",
    "uae": "AE",
}


def extract_country_code(location_str: str) -> str:
    if not location_str or not isinstance(location_str, str):
        return ""

    lower = location_str.strip().lower()
    for name, code in COUNTRY_NAME_TO_CODE.items():
        if name in lower:
            return code

    return ""


# ─── STEP 1: GET SEARCH TITLES FROM PREDICTED ROLE ────────────────────────────
def get_search_titles(predicted_role: str) -> list:
    """
    Returns 3 related job titles for the predicted role.
    Falls back to using the role name directly if not in map.
    """
    titles = ROLE_TITLES_MAP.get(predicted_role)
    if titles:
        return titles

    # Fallback — use role name as-is
    return [predicted_role, predicted_role + " Specialist", predicted_role + " Lead"]


# ─── STEP 2: FETCH JOBS FROM THEIRSTACK ───────────────────────────────────────
def fetch_jobs(search_titles: list, limit_per_title: int = 4, country_code: str = "", years_exp: int = 0) -> list:
    """
    Fetch 4 jobs per title → up to 12 raw jobs total.
    Deduplicates by job ID and title+company combination.
    Uses optional country filter from resume location.
    Adds seniority filter based on years of experience.
    """
    if not THEIRSTACK_KEY:
        print("THEIRSTACK_KEY not set. Skipping TheirStack and using fallback jobs.")
        return []

    headers = {
        "Authorization": f"Bearer {THEIRSTACK_KEY}",
        "Content-Type": "application/json",
        "Accept":        "application/json",
    }

    all_jobs    = []
    seen_ids    = set()
    seen_titles = set()

    # Map years_exp to TheirStack seniority values
    seniority_filter = None
    if years_exp is not None:
        if years_exp <= 1:
            seniority_filter = ["entry", "entry_level", "junior"]
        elif years_exp <= 4:
            seniority_filter = ["mid", "mid_level", "entry_level"]
        else:
            seniority_filter = ["senior", "mid_level", "lead"]

    for title in search_titles:
        try:
            payload = {
                "job_title_or":           [title],
                "job_location_pattern_or": ["Ahmedabad", "Surat"],
                "posted_at_max_age_days":  30,
                "limit": limit_per_title,
            }

            if seniority_filter:
                payload["seniority"] = seniority_filter

            if country_code:
                payload["job_country_code_or"] = [country_code]

            response = requests.post(
                THEIRSTACK_URL,
                headers=headers,
                json=payload,
                timeout=15
            )

            if response.status_code != 200:
                print(f"TheirStack error for '{title}': {response.status_code}")
                continue

            jobs = response.json().get("data", [])

            for job in jobs:
                job_id    = job.get("id")
                title_key = f"{job.get('job_title', '')}_{job.get('company', '')}"

                if job_id not in seen_ids and title_key not in seen_titles:
                    seen_ids.add(job_id)
                    seen_titles.add(title_key)
                    all_jobs.append(job)

            print(f"Title '{title}' → {len(jobs)} jobs fetched")

        except Exception as e:
            print(f"Fetch error for '{title}': {e}")
            continue

    print(f"Total unique jobs: {len(all_jobs)}")
    return all_jobs


# ─── STEP 3: BUILD TEXT FOR EMBEDDING ─────────────────────────────────────────
def build_resume_text(parsed_resume: dict) -> str:
    skills = " ".join(parsed_resume.get("skills", []))
    edu    = " ".join(parsed_resume.get("education", []))
    exp    = str(parsed_resume.get("years_experience", ""))
    return f"{skills} {exp} years experience {edu}".strip()


def build_job_text(job: dict) -> str:
    title    = job.get("job_title", "")
    skills   = " ".join(job.get("technology_slugs", []))
    keywords = " ".join(job.get("keyword_slugs", [])[:20])
    snippet  = (job.get("description") or "")[:300]
    return f"{title} {skills} {keywords} {snippet}".strip()


def _normalize_skill(skill: str) -> str:
    return str(skill or "").strip().lower()


# ─── STEP 4: SCORE JOBS ───────────────────────────────────────────────────────
def score_jobs(parsed_resume: dict, jobs: list) -> list:
    """
    Score each job:
    - 65% semantic similarity (sentence transformers)
    - skill overlap bonus
    - seniority match bonus/penalty
    - skill gap penalty
    """
    if not jobs:
        return []

    resume_text   = build_resume_text(parsed_resume)
    resume_vec    = embedder.encode([resume_text])
    resume_skills = set(s.lower() for s in parsed_resume.get("skills", []))
    years_exp     = parsed_resume.get("years_experience", 0)

    scored = []

    for job in jobs:
        try:
            # Semantic similarity
            job_text  = build_job_text(job)
            job_vec   = embedder.encode([job_text])
            sem_score = float(cosine_similarity(resume_vec, job_vec)[0][0])

            # Skill overlap bonus (max 0.20)
            job_skills     = set(_normalize_skill(s) for s in job.get("technology_slugs", []))
            job_keywords   = set(_normalize_skill(s) for s in job.get("keyword_slugs", []))
            all_job_skills = job_skills | job_keywords
            overlap        = len(resume_skills & all_job_skills)
            skill_bonus    = min(overlap * 0.02, 0.20)

            # Seniority match bonus/penalty
            def seniority_score(years_exp, job_seniority):
                s = (job_seniority or "").lower()
                
                if years_exp <= 1:          # Fresher
                    if s in ["entry", "entry_level", "junior"]:
                        return +0.20        # strong boost
                    elif s in ["mid", "mid_level"]:
                        return -0.10        # soft penalty
                    elif s in ["senior", "lead", "c_level"]:
                        return -0.30        # hard penalty — pushes to bottom
                    return 0.0

                elif years_exp <= 4:        # Mid-level
                    if s in ["mid", "mid_level"]:
                        return +0.20
                    elif s in ["entry", "entry_level"]:
                        return -0.05
                    elif s in ["senior", "lead"]:
                        return +0.05        # stretch — slight boost ok
                    return 0.0

                else:                       # Senior
                    if s in ["senior", "lead", "c_level", "principal"]:
                        return +0.20
                    elif s in ["mid", "mid_level"]:
                        return -0.05
                    elif s in ["entry", "entry_level"]:
                        return -0.20
                    return 0.0

            sen_score = seniority_score(years_exp, job.get("seniority", ""))

            # Skill gap penalty
            gap_skills = all_job_skills - resume_skills
            gap_ratio  = len(gap_skills) / max(len(all_job_skills), 1)
            gap_penalty = min(gap_ratio * 0.15, 0.10)

            final_score = (sem_score * 0.65) + skill_bonus + sen_score - gap_penalty

            # Build reason string
            reasons = []
            matched_skills = resume_skills & all_job_skills
            if matched_skills:
                top = list(matched_skills)[:3]
                reasons.append(f"Matches your skills: {', '.join(top)}")
            if sen_score > 0:
                reasons.append("Good fit for your experience level")
            if job.get("remote"):
                reasons.append("Remote position")

            explanation = {
                "reason": "Based on your profile",
                "highlights": [],
                "breakdown": {
                    "skill_match": int(round(min(len(matched_skills) / max(len(all_job_skills), 1), 1) * 100)),
                    "profile_fit": int(round(min(max(sem_score, 0.0), 1.0) * 100)),
                    "level_fit": int(round(max(0.0, min(1.0, (sen_score + 0.3) / 0.5)) * 100)),
                },
                "matched_skills": list(matched_skills),
                "missing_skills": [],
            }

            if matched_skills:
                reason_text = f"Your skills in {', '.join(list(matched_skills)[:3])} make this role a strong match."
                explanation["reason"] = reason_text
                explanation["highlights"].append(f"{len(matched_skills)} skills matched")
            else:
                explanation["reason"] = "This role matches your profile and recommended path."

            if sen_score >= 0.15:
                explanation["highlights"].append("Good fit for your level")
            elif sen_score >= 0:
                explanation["highlights"].append("Reasonable seniority fit")
            else:
                explanation["highlights"].append("Opportunity to grow into this role")

            if job.get("remote"):
                explanation["highlights"].append("Remote friendly")
            elif job.get("hybrid"):
                explanation["highlights"].append("Hybrid option available")

            if len(explanation["highlights"]) > 3:
                explanation["highlights"] = explanation["highlights"][:3]

            ordered_missing = []
            for candidate in list(job.get("technology_slugs", [])) + list(job.get("keyword_slugs", [])):
                if candidate and candidate not in matched_skills and _normalize_skill(candidate) not in {s.lower() for s in ordered_missing}:
                    ordered_missing.append(candidate)
            explanation["missing_skills"] = ordered_missing[:5]

            scored.append({
                # Job details
                "job_id":         job.get("id"),
                "job_title":      job.get("job_title", ""),
                "title":          job.get("job_title") or job.get("title") or "",
                "company":        job.get("company", ""),
                "location":       job.get("short_location") or job.get("location") or "Remote",
                "country":        job.get("country", ""),
                "country_code":   job.get("country_code", ""),
                "state_code":     job.get("state_code", ""),
                "url":            job.get("url", ""),
                "seniority":      job.get("seniority", ""),
                "remote":         job.get("remote", False),
                "hybrid":         job.get("hybrid", False),
                "date_posted":    job.get("date_posted", ""),
                "salary":         job.get("salary_string"),
                "employment_type": (job.get("employment_statuses") or [""])[0],
                "company_logo":   (job.get("company_object") or {}).get("logo", ""),
                # Scoring
                "match_score":    round(final_score * 100, 1),
                "matched_skills": list(matched_skills),
                "matchedSkills":  list(matched_skills),
                "missing_skills": explanation["missing_skills"],
                "reason":         explanation["reason"],
                "explanation":    explanation,
            })

        except Exception as e:
            print(f"Scoring error: {e}")
            continue

    # Sort by match score descending
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored


# ─── STEP 5: SORT BY LOCATION ─────────────────────────────────────────────────
def sort_by_location(scored_jobs: list, candidate_location: str) -> dict:
    """
    Split jobs into 3 buckets based on candidate location:
    - local:   jobs in candidate's state/city
    - country: jobs in candidate's country
    - global:  all other jobs

    Since TheirStack doesn't support location filter in API,
    we sort after fetching based on location field matching.
    """
    if not candidate_location:
        return {
            "local":   [],
            "country": [],
            "global":  scored_jobs
        }

    location_lower = candidate_location.lower()

    # Extract possible state and country from location string
    # e.g. "Gujarat, India" → state="gujarat", country="india"
    parts          = [p.strip().lower() for p in location_lower.split(",")]
    candidate_state   = parts[0] if len(parts) > 0 else ""
    candidate_country = parts[-1] if len(parts) > 1 else ""

    local_jobs   = []
    country_jobs = []
    global_jobs  = []

    for job in scored_jobs:
        job_location = (
            job.get("location") or
            job.get("country") or ""
        ).lower()

        job_country = job.get("country", "").lower()

        # Check local match (state/city level)
        if candidate_state and candidate_state in job_location:
            local_jobs.append(job)

        # Check country match
        elif candidate_country and candidate_country in job_country:
            country_jobs.append(job)

        # Global
        else:
            global_jobs.append(job)

    print(f"Location split → local: {len(local_jobs)}, "
          f"country: {len(country_jobs)}, global: {len(global_jobs)}")

    return {
        "local":   local_jobs,
        "country": country_jobs,
        "global":  global_jobs
    }


# ─── STEP 6: GET TOP 5 FOR UPLOAD PAGE ────────────────────────────────────────
def get_top5_for_upload_page(location_buckets: dict) -> list:
    """
    Priority order for top 5 on upload page:
    1. Local jobs first (nearest)
    2. Country jobs second
    3. Global jobs last
    """
    priority_list = (
        location_buckets["local"] +
        location_buckets["country"] +
        location_buckets["global"]
    )
    return priority_list[:5]


# ─── MAIN FUNCTION ────────────────────────────────────────────────────────────
def get_recommendations(parsed_resume: dict) -> dict:
    """
    Full pipeline:
    parsed_resume → predict role → fetch jobs → score → sort by location

    Returns:
    {
        predicted_role, confidence,
        total_found,
        top5,           ← for upload page
        all_jobs,       ← for jobs page (all 30, sorted by location then score)
        by_location: {local, country, global}  ← for category tabs
    }
    """
    # unwrap from /parse response shape
    if isinstance(parsed_resume, dict) and "parsedData" in parsed_resume:
        parsed_resume = parsed_resume["parsedData"]

    # Step 1 — predict role using trained model
    role_result    = predict_role(parsed_resume)
    predicted_role = role_result["predicted_role"]
    confidence     = role_result["confidence"]
    print(f"Predicted role: {predicted_role} ({confidence}%)")

    resume_skills = set(s.lower() for s in parsed_resume.get("skills", []))

    # Step 2 — get related job titles for this role
    search_titles = get_search_titles(predicted_role)
    print(f"Search titles: {search_titles}")

    # Step 3 — determine candidate location fields and fetch jobs from TheirStack
    candidate_city = parsed_resume.get("city", "")
    candidate_state = parsed_resume.get("state", "")
    candidate_country = parsed_resume.get("country", "")
    candidate_location = parsed_resume.get("location", "")
    years_exp = parsed_resume.get("years_experience", 0)

    # Build the best location string for sorting and fallback search
    if not candidate_location:
        candidate_location = ", ".join(filter(None, [candidate_city, candidate_state, candidate_country]))

    # Extract country code for API payload either from explicit candidate country code, recognized country, or parsed country
    candidate_country_code = (
        parsed_resume.get("country_code", "")
        or extract_country_code(candidate_country)
        or extract_country_code(candidate_location)
    )

    raw_jobs = fetch_jobs(search_titles, limit_per_title=4, country_code=candidate_country_code, years_exp=years_exp)

    # Fallback: if no jobs found with filter, try without
    if len(raw_jobs) == 0:
        print("No jobs found with seniority filter, retrying without...")
        raw_jobs = fetch_jobs(search_titles, limit_per_title=4, country_code=candidate_country_code, years_exp=None)

    if not raw_jobs:
        # if API key is missing/invalid, fallback to synthetic job list
        if not THEIRSTACK_KEY:
            try:
                import pandas as pd
                dataset_path = os.path.join(os.path.dirname(__file__), "sample_jobs.csv")
                df = pd.read_csv(dataset_path)
                
                # Simple heuristic search in Role or Job Title
                df_filtered = df[df['Role'].str.contains(predicted_role, case=False, na=False) | df['Job Title'].str.contains(predicted_role, case=False, na=False)]
                
                # If no direct matches, just sample random jobs or fallback
                if df_filtered.empty:
                    df_filtered = df.sample(min(15, len(df)))
                else:
                    df_filtered = df_filtered.sample(min(15, len(df_filtered)))
                
                raw_jobs = []
                for _, row in df_filtered.iterrows():
                    comp = str(row.get('Company', 'Tech Company'))
                    job_title = str(row.get('Job Title', predicted_role))
                    skills = [s.strip() for s in str(row.get('skills', '')).split(',')]
                    raw_jobs.append(
                        {
                            "id": str(row.get('Job Id', f"fallback-{len(raw_jobs)}")),
                            "job_title": job_title,
                            "company": comp,
                            "location": str(row.get('location', 'Remote')),
                            "short_location": str(row.get('location', 'Remote')),
                            "country": str(row.get('Country', 'Global')),
                            "url": f"https://www.linkedin.com/jobs/search/?keywords={job_title.replace(' ', '%20')}%20{comp.replace(' ', '%20')}",
                            "technology_slugs": skills,
                            "keyword_slugs": skills,
                            "description": str(row.get('Job Description', 'This is a dynamically recommended job from our dataset.')),
                            "seniority": "Mid",
                            "remote": False,
                            "hybrid": False,
                            "salary_string": str(row.get('Salary Range', '$80,000')),
                        }
                    )
            except Exception as e:
                print(f"Dataset fallback failed: {e}")
                raw_jobs = []
                for i in range(15):
                    raw_jobs.append(
                        {
                            "id": f"fallback-{i}",
                            "job_title": f"{predicted_role}",
                            "company": "Decent Company",
                            "location": "Remote",
                            "short_location": "Remote",
                            "country": "Global",
                            "url": f"https://www.linkedin.com/jobs/search/?keywords={predicted_role.replace(' ', '%20')}",
                            "technology_slugs": parsed_resume.get("skills", []),
                            "keyword_slugs": parsed_resume.get("skills", []),
                            "description": "This is a fallback job.",
                            "seniority": "Mid",
                            "remote": True,
                            "hybrid": False,
                            "salary_string": "$60,000",
                        }
                    )
        else:
            return {
                "predicted_role": predicted_role,
                "confidence":     confidence,
                "total_found":    0,
                "top5":           [],
                "all_jobs":       [],
                "by_location":    {"local": [], "country": [], "global": []},
                "message":        "No jobs found. Try again later."
            }

    # Step 4 — score all jobs
    scored_jobs = score_jobs(parsed_resume, raw_jobs)

    # Step 5 — sort by location
    candidate_location = parsed_resume.get("location", "")
    location_buckets   = sort_by_location(scored_jobs, candidate_location)

    # Step 6 — top 5 for upload page (nearest first)
    top5 = get_top5_for_upload_page(location_buckets)

    # Step 7 — all jobs sorted (local → country → global)
    all_jobs_sorted = (
        location_buckets["local"] +
        location_buckets["country"] +
        location_buckets["global"]
    )

    missing_skills_set = set()
    for job in scored_jobs:
        missing_skills_set.update(job.get("missing_skills", []))

    skill_suggestions = get_skill_suggestions(
        missing_skills=list(missing_skills_set),
        predicted_role=predicted_role,
        resume_skills=list(resume_skills),
    )

    return {
        "predicted_role": predicted_role,
        "confidence":     confidence,
        "total_found":    len(scored_jobs),
        "top5":           top5,
        "all_jobs":       all_jobs_sorted,
        "by_location":    location_buckets,
        "skill_suggestions": skill_suggestions,
    }