import os
import joblib
import re
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

# ─── PATHS ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "job_role_model.pkl")
VEC_PATH   = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")
DATA_PATH  = os.path.join(BASE_DIR, "job_descriptions.csv")

os.makedirs(MODELS_DIR, exist_ok=True)


# ─── ROLE GROUPING ─────────────────────────────────────────────────────────────
def group_role(role: str) -> str:
    r = str(role).lower()

    if any(w in r for w in [
        'machine learning', 'ml engineer', 'ai engineer', 'artificial intelligence',
        'nlp', 'deep learning', 'data scien', 'computer vision', 'research scientist'
    ]):
        return "AI/ML Engineer"

    if any(w in r for w in [
        'data analyst', 'business analyst', 'data engineer',
        'database', 'big data', 'etl', 'analytics'
    ]):
        return "Data Analyst/Engineer"

    if any(w in r for w in [
        'frontend', 'front end', 'front-end', 'ui developer',
        'react developer', 'angular developer', 'vue developer', 'web designer'
    ]):
        return "Frontend Developer"

    if any(w in r for w in [
        'full stack', 'fullstack', 'full-stack', 'web developer'
    ]):
        return "Full Stack Developer"

    if any(w in r for w in [
        'backend', 'back end', 'back-end', 'api developer',
        'java developer', 'python developer', 'node developer',
        'software engineer', 'software developer'
    ]):
        return "Backend Developer"

    if any(w in r for w in [
        'devops', 'cloud engineer', 'site reliability',
        'infrastructure', 'systems admin', 'network engineer',
        'network admin'
    ]):
        return "DevOps/Cloud Engineer"

    if any(w in r for w in [
        'android', 'ios developer', 'mobile developer',
        'flutter', 'react native'
    ]):
        return "Mobile Developer"

    if any(w in r for w in [
        'security engineer', 'cyber', 'penetration', 'ethical hack'
    ]):
        return "Security Engineer"

    if any(w in r for w in [
        'qa engineer', 'quality assurance', 'software tester', 'test engineer'
    ]):
        return "QA Engineer"

    if any(w in r for w in [
        'ux', 'ui/ux', 'ux/ui', 'product designer', 'graphic designer'
    ]):
        return "UX/UI Designer"

    if any(w in r for w in [
        'product manager', 'project manager', 'scrum master'
    ]):
        return "Product/Project Manager"

    if any(w in r for w in [
        'marketing', 'seo', 'sem', 'social media', 'content',
        'brand', 'copywriter', 'advertising'
    ]):
        return "Marketing Specialist"

    if any(w in r for w in [
        'financial', 'finance', 'investment', 'accountant',
        'tax', 'audit', 'banker', 'wealth', 'insurance'
    ]):
        return "Finance Specialist"

    if any(w in r for w in [
        'hr ', 'human resource', 'recruiter', 'talent', 'payroll'
    ]):
        return "HR Specialist"

    if any(w in r for w in [
        'sales', 'business development', 'account executive'
    ]):
        return "Sales Specialist"

    if any(w in r for w in [
        'legal', 'lawyer', 'attorney', 'paralegal', 'counsel'
    ]):
        return "Legal Specialist"

    if any(w in r for w in [
        'doctor', 'nurse', 'physician', 'medical',
        'therapist', 'pharmacist', 'dentist', 'surgeon'
    ]):
        return "Healthcare Professional"

    if any(w in r for w in [
        'teacher', 'professor', 'educator', 'instructor', 'trainer'
    ]):
        return "Educator"

    if any(w in r for w in [
        'operations', 'supply chain', 'logistics',
        'procurement', 'warehouse', 'inventory', 'purchasing'
    ]):
        return "Operations Specialist"

    return "Other"


# ─── TRAIN & SAVE MODEL ────────────────────────────────────────────────────────
def train_model():
    print("Loading dataset...")
    df = pd.read_csv(
        DATA_PATH,
        usecols=['Role', 'skills', 'Qualifications'],
        nrows=400000
    )

    # Clean
    df = df.dropna(subset=['Role', 'skills'])
    df['Qualifications'] = df['Qualifications'].fillna('')

    # Combine input features
    df['combined'] = (
        df['skills'].astype(str) + " " +
        df['Qualifications'].astype(str)
    )

    # Group roles
    df['Role_grouped'] = df['Role'].apply(group_role)

    # Keep only roles with min 50 samples
    role_counts = df['Role_grouped'].value_counts()
    valid_roles = role_counts[role_counts >= 50].index
    df = df[df['Role_grouped'].isin(valid_roles)]

    # Sample 200 per role for balanced training
    df = df.groupby('Role_grouped', group_keys=False).apply(
        lambda x: x.sample(min(len(x), 200), random_state=42)
    ).reset_index(drop=True)

    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"Training on {df.shape[0]} samples, {df['Role_grouped'].nunique()} roles")

    X = df['combined']
    y = df['Role_grouped']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Vectorize
    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec  = vectorizer.transform(X_test)

    # Train
    print("Training Logistic Regression...")
    model = LogisticRegression(
        max_iter=1000,
        random_state=42,
        C=1.0
    )
    model.fit(X_train_vec, y_train)

    # Evaluate
    y_pred   = model.predict(X_test_vec)
    test_acc = accuracy_score(y_test, y_pred)
    cv_scores = cross_val_score(model, X_train_vec, y_train, cv=5)

    print(f"Test Accuracy:      {test_acc:.4f}")
    print(f"CV Accuracy (mean): {cv_scores.mean():.4f}")
    print(f"CV Accuracy (std):  {cv_scores.std():.4f}")

    # Save
    joblib.dump(model,      MODEL_PATH)
    joblib.dump(vectorizer, VEC_PATH)
    print(f"Model saved:      {MODEL_PATH}")
    print(f"Vectorizer saved: {VEC_PATH}")

    return model, vectorizer


# ─── PREDICT JOB ROLE (ROBUST HEURISTIC SCORER) ────────────────────────────────
ROLE_KEYWORDS = {
    "AI/ML Engineer": ["machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn", "ai", "artificial intelligence", "neural networks"],
    "Data Analyst/Engineer": ["data analyst", "data engineer", "sql", "pandas", "numpy", "tableau", "power bi", "excel", "big data", "etl", "data visualization", "matplotlib", "seaborn", "data science"],
    "Frontend Developer": ["frontend", "front end", "react", "angular", "vue", "html", "css", "javascript", "typescript", "ui developer", "tailwind", "bootstrap"],
    "Backend Developer": ["backend", "back end", "node", "express", "django", "flask", "spring boot", "java", "python", "api", "c#", ".net", "ruby on rails", "php", "laravel", "go", "golang"],
    "Full Stack Developer": ["full stack", "fullstack", "mern", "mean", "lamp", "web developer"],
    "DevOps/Cloud Engineer": ["devops", "cloud", "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ci/cd", "terraform", "ansible", "linux"],
    "Mobile Developer": ["android", "ios", "flutter", "react native", "swift", "kotlin", "mobile app", "xcode"],
    "Security Engineer": ["security", "cyber", "penetration testing", "ethical hacking", "infosec", "firewall", "cryptography"],
    "QA Engineer": ["qa", "quality assurance", "testing", "selenium", "cypress", "jest", "pytest", "automation testing"],
    "UX/UI Designer": ["ux", "ui", "figma", "adobe xd", "sketch", "user experience", "user interface", "wireframing", "prototyping"],
    "Product/Project Manager": ["product manager", "project manager", "scrum", "agile", "jira", "pmp", "kanban"],
    "Marketing Specialist": ["marketing", "seo", "sem", "social media", "content strategy", "google analytics", "copywriting", "hubspot"],
    "Finance Specialist": ["finance", "accounting", "financial modeling", "excel", "valuation", "tax", "audit", "cpa", "cfa"],
    "HR Specialist": ["hr", "human resources", "recruitment", "talent acquisition", "onboarding", "employee relations"],
    "Sales Specialist": ["sales", "business development", "b2b", "crm", "salesforce", "lead generation", "account management"],
    "Legal Specialist": ["legal", "lawyer", "attorney", "paralegal", "contracts", "compliance", "litigation"],
    "Healthcare Professional": ["doctor", "nurse", "medical", "patient care", "healthcare", "clinical", "pharmacy"],
    "Educator": ["teacher", "educator", "curriculum", "teaching", "instruction", "tutoring"],
    "Operations Specialist": ["operations", "supply chain", "logistics", "procurement", "inventory management", "process improvement"]
}

def load_model():
    pass # Deprecated in favor of deterministic scoring for cross-platform stability

def predict_role(parsed_resume: dict) -> dict:
    """
    Input:  parsed resume dict from utils.py
    Output: predicted role + confidence score
    Uses a robust deterministic keyword matching system.
    """
    skills = [s.lower() for s in parsed_resume.get("skills", [])]
    raw_text = parsed_resume.get("raw_text", "").lower()
    
    scores = {role: 0 for role in ROLE_KEYWORDS}
    
    # 1. Score based on explicit extracted skills (High confidence)
    for skill in skills:
        for role, keywords in ROLE_KEYWORDS.items():
            if skill in keywords:
                scores[role] += 3
            elif any(kw in skill for kw in keywords):
                scores[role] += 1
                
    # 2. Score based on raw text keyword mentions (Medium confidence)
    if raw_text:
        for role, keywords in ROLE_KEYWORDS.items():
            for kw in keywords:
                if kw in raw_text:
                    scores[role] += 1
                    
    # 3. Check for explicit job title mentions using group_role
    title_guess = group_role(raw_text)
    if title_guess != "Other":
        scores[title_guess] += 10 # Massive boost if they literally state the title
        
    best_role = max(scores, key=scores.get)
    
    if scores[best_role] > 0:
        # Calculate a pseudo-confidence score
        total_score = sum(scores.values())
        conf = round(min(99.0, (scores[best_role] / total_score) * 100 + 20), 1)
        return {"predicted_role": best_role, "confidence": conf}

    return {"predicted_role": "Other", "confidence": 0.0}

if __name__ == "__main__":
    print("Model training deprecated. Using deterministic heuristic engine.")