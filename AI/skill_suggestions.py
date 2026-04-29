from typing import Dict, List

ROLE_SKILL_ROADMAP = {
    "Backend Developer": {
        "core": ["Python", "SQL", "API design", "Databases", "REST"],
        "advanced": ["Microservices", "Docker", "Kubernetes", "Cloud architecture"],
        "tools": ["Git", "Linux", "CI/CD", "Postman"],
    },
    "Frontend Developer": {
        "core": ["JavaScript", "HTML", "CSS", "React", "Responsive design"],
        "advanced": ["TypeScript", "State management", "Performance tuning", "Accessibility"],
        "tools": ["Git", "Webpack", "Figma", "Browser DevTools"],
    },
    "Full Stack Developer": {
        "core": ["JavaScript", "Python", "React", "Node.js", "SQL"],
        "advanced": ["Docker", "API design", "Cloud", "Microservices"],
        "tools": ["Git", "Linux", "CI/CD", "Postman"],
    },
    "AI/ML Engineer": {
        "core": ["Python", "Machine Learning", "Data Analysis", "TensorFlow", "PyTorch"],
        "advanced": ["NLP", "Computer Vision", "Model Deployment", "Statistics"],
        "tools": ["Git", "Docker", "MLflow", "Pandas"],
    },
    "Data Analyst/Engineer": {
        "core": ["SQL", "Python", "Data Visualization", "Tableau", "Excel"],
        "advanced": ["Power BI", "Pandas", "BigQuery", "ETL"],
        "tools": ["Git", "Snowflake", "dbt", "SQL Server"],
    },
    "DevOps/Cloud Engineer": {
        "core": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
        "advanced": ["Terraform", "Monitoring", "Networking", "Security"],
        "tools": ["Git", "Helm", "CloudWatch", "Jenkins"],
    },
    "Mobile Developer": {
        "core": ["Android", "iOS", "Kotlin", "Swift", "React Native"],
        "advanced": ["Mobile UI", "API Integration", "Performance", "Unit Testing"],
        "tools": ["Git", "Firebase", "Xcode", "Android Studio"],
    },
    "Security Engineer": {
        "core": ["Network Security", "Penetration Testing", "Incident Response", "Cloud Security"],
        "advanced": ["Vulnerability Assessment", "Threat Modeling", "Secure Coding", "Compliance"],
        "tools": ["Wireshark", "Nmap", "Kali Linux", "Metasploit"],
    },
    "QA Engineer": {
        "core": ["Test Automation", "Selenium", "Test Planning", "Bug Tracking"],
        "advanced": ["API Testing", "Performance Testing", "Scripting", "Regression Testing"],
        "tools": ["Jira", "Postman", "Git", "PyTest"],
    },
    "UX/UI Designer": {
        "core": ["Wireframing", "Prototyping", "User Research", "Figma", "Visual Design"],
        "advanced": ["Accessibility", "Interaction Design", "Design Systems", "User Testing"],
        "tools": ["Adobe XD", "Sketch", "Miro", "InVision"],
    },
    "Product/Project Manager": {
        "core": ["Roadmapping", "Stakeholder Management", "Agile", "Requirements Gathering", "Communication"],
        "advanced": ["Sprint Planning", "Metrics", "Risk Management", "Prioritization"],
        "tools": ["Jira", "Notion", "Trello", "Confluence"],
    },
    "Other": {
        "core": ["Communication", "Problem Solving", "Teamwork", "Adaptability"],
        "advanced": ["Time Management", "Reporting", "Documentation", "Collaboration"],
        "tools": ["Google Workspace", "Slack", "Zoom", "Microsoft Office"],
    },
}

SKILL_RESOURCES = {
    "python": {
        "url": "https://www.learnpython.org/",
        "platform": "LearnPython.org",
        "free": True,
    },
    "javascript": {
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "platform": "MDN Web Docs",
        "free": True,
    },
    "sql": {
        "url": "https://www.codecademy.com/learn/learn-sql",
        "platform": "Codecademy",
        "free": True,
    },
    "react": {
        "url": "https://reactjs.org/docs/getting-started.html",
        "platform": "React",
        "free": True,
    },
    "docker": {
        "url": "https://www.docker.com/101-tutorial",
        "platform": "Docker",
        "free": True,
    },
    "kubernetes": {
        "url": "https://www.katacoda.com/courses/kubernetes",
        "platform": "Katacoda",
        "free": True,
    },
    "aws": {
        "url": "https://aws.amazon.com/training/digital/",
        "platform": "AWS Training",
        "free": True,
    },
    "git": {
        "url": "https://www.atlassian.com/git/tutorials/learn-git-with-bitbucket-cloud",
        "platform": "Atlassian",
        "free": True,
    },
    "html": {
        "url": "https://www.w3schools.com/html/",
        "platform": "W3Schools",
        "free": True,
    },
    "css": {
        "url": "https://www.w3schools.com/css/",
        "platform": "W3Schools",
        "free": True,
    },
    "typescript": {
        "url": "https://www.typescriptlang.org/docs/",
        "platform": "TypeScript",
        "free": True,
    },
    "node.js": {
        "url": "https://nodejs.dev/learn",
        "platform": "Node.js",
        "free": True,
    },
    "machine learning": {
        "url": "https://www.coursera.org/learn/machine-learning?utm_source=google&utm_medium=search&utm_campaign=global&utm_content=machine%20learning",
        "platform": "Coursera",
        "free": True,
    },
    "nlp": {
        "url": "https://www.coursera.org/learn/language-processing",
        "platform": "Coursera",
        "free": True,
    },
    "tensorflow": {
        "url": "https://www.tensorflow.org/learn",
        "platform": "TensorFlow",
        "free": True,
    },
    "pytorch": {
        "url": "https://pytorch.org/tutorials/",
        "platform": "PyTorch",
        "free": True,
    },
    "tableau": {
        "url": "https://www.tableau.com/learn/training/20211",
        "platform": "Tableau",
        "free": True,
    },
    "power bi": {
        "url": "https://learn.microsoft.com/en-us/power-bi/fundamentals/",
        "platform": "Microsoft Learn",
        "free": True,
    },
    "pandas": {
        "url": "https://pandas.pydata.org/docs/getting_started/index.html",
        "platform": "pandas",
        "free": True,
    },
    "tensorflow": {
        "url": "https://www.tensorflow.org/learn",
        "platform": "TensorFlow",
        "free": True,
    },
    "css": {
        "url": "https://www.w3schools.com/css/",
        "platform": "W3Schools",
        "free": True,
    },
    "excel": {
        "url": "https://support.microsoft.com/en-us/excel",
        "platform": "Microsoft",
        "free": True,
    },
}


def _normalize_skill(skill: str) -> str:
    return str(skill or "").strip().lower()


def _find_resource(skill_name: str) -> Dict:
    key = _normalize_skill(skill_name)
    return SKILL_RESOURCES.get(key, {
        "url": "https://www.google.com/search?q=" + skill_name.replace(" ", "+"),
        "platform": "Search",
        "free": True,
    })


def _role_cards_for(predicted_role: str) -> Dict[str, List[str]]:
    return ROLE_SKILL_ROADMAP.get(predicted_role, ROLE_SKILL_ROADMAP["Other"])


def get_skill_suggestions(missing_skills, predicted_role, resume_skills):
    resume_lower = { _normalize_skill(skill) for skill in resume_skills or [] }
    roadmap = _role_cards_for(predicted_role)

    core = roadmap["core"]
    advanced = roadmap["advanced"]
    tools = roadmap["tools"]

    strengths = [skill for skill in core if _normalize_skill(skill) in resume_lower]
    readiness = int(round(len(strengths) / max(len(core), 1) * 100))

    missing_set = { _normalize_skill(skill) for skill in missing_skills or [] }
    ordered_candidates = []

    for skill in core:
        if _normalize_skill(skill) in missing_set:
            ordered_candidates.append((skill, "high"))
    for skill in advanced:
        if _normalize_skill(skill) in missing_set:
            ordered_candidates.append((skill, "medium"))
    for skill in tools:
        if _normalize_skill(skill) in missing_set:
            ordered_candidates.append((skill, "medium"))

    # Add any unknown but missing skills if we still need items
    for skill in missing_skills or []:
        if len(ordered_candidates) >= 5:
            break
        normalized = _normalize_skill(skill)
        if normalized not in { _normalize_skill(k) for k, _ in ordered_candidates }:
            ordered_candidates.append((skill, "medium"))

    learn_next = []
    
    # If jobs didn't provide missing skills (e.g., dummy jobs), fallback to suggesting core/advanced skills not in resume
    if not ordered_candidates:
        for skill in core + advanced + tools:
            if len(ordered_candidates) >= 5:
                break
            if _normalize_skill(skill) not in resume_lower:
                priority = "high" if skill in core else "medium"
                ordered_candidates.append((skill, priority))

    for skill, priority in ordered_candidates[:5]:
        resource = _find_resource(skill)
        reason = (
            "A core skill for this role." if priority == "high"
            else "A valuable skill that boosts your readiness for this role."
        )
        learn_next.append({
            "skill": skill,
            "priority": priority,
            "reason": reason,
            "resource": resource,
        })

    missing_count = len(missing_set)

    return {
        "role": predicted_role,
        "readiness": readiness,
        "strengths": strengths,
        "learn_next": learn_next,
        "missing_count": missing_count,
    }
