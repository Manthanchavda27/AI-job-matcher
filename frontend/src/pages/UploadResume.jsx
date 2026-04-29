import Navbar from "../components/Navbar";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";
import { saveJobHistory } from "../utils/jobHistory";

// ── Seniority Mapping ─────────────────────────────────────────────────────────
function formatSeniority(raw) {
  const map = {
    entry: "Fresher",
    entry_level: "Fresher",
    junior: "Fresher",
    mid: "Mid Level",
    mid_level: "Mid Level",
    senior: "Senior",
    lead: "Senior",
    c_level: "Senior",
    principal: "Senior",
  };
  return map[raw?.toLowerCase()] || null;
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job }) {
  const seniorityLabel = formatSeniority(job.seniority);

  return (
    <div className={`relative bg-white border rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow ${job.isApplied ? "border-l-4 border-l-green-400" : "border-gray-100"}`}>
      {/* LINE 1: Company Name */}
      <p className="text-base font-bold text-gray-900">{job.company}</p>

      {/* LINE 2: Job Title */}
      <p className="text-sm font-medium text-gray-700">{job.title}</p>

      {/* LINE 3: Location */}
      <p className="text-xs text-gray-500">📍 {job.location || "Remote"}</p>

      {/* LINE 4: Tags Row */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {/* Seniority Pill */}
        {seniorityLabel && (
          <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
            {seniorityLabel}
          </span>
        )}

        {/* Remote/Hybrid Pill */}
        {job.isRemote && (
          <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
            🌐 Remote
          </span>
        )}
        {job.isHybrid && (
          <span className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full">
            🏢 Hybrid
          </span>
        )}

        {/* Salary Pill */}
        {job.salary && (
          <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
            💰 {job.salary}
          </span>
        )}
      </div>

      {/* LINE 5: Matched Skills */}
      {job.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-400">Matched skills:</span>
          {job.matchedSkills.slice(0, 4).map((sk, i) => (
            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {sk}
            </span>
          ))}
          {job.matchedSkills.length > 4 && (
            <span className="text-xs text-gray-400">+{job.matchedSkills.length - 4} more</span>
          )}
        </div>
      )}

      {/* LINE 6: Action Buttons */}
      <div className="flex gap-2">
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply →
          </a>
        ) : (
          <button
            disabled
            className="flex-1 text-center bg-gray-100 text-gray-400 text-xs px-3 py-1.5 rounded-lg cursor-not-allowed"
          >
            No link
          </button>
        )}
        <button
          onClick={() => { }}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${job.isSaved ? "bg-yellow-50 border-yellow-300 text-yellow-600" : "border-gray-200 text-gray-400 hover:border-yellow-300 hover:text-yellow-500"}`}>
          {job.isSaved ? "⭐" : "☆"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UploadResume() {
  const navigate = useNavigate();

  if (localStorage.getItem("isLoggedIn") !== "true") {
    return <Navigate to="/" replace />;
  }

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [aiResult, setAiResult] = useState(null);   // parsedData
  const [resumeScore, setResumeScore] = useState(null);
  const [skillSuggestions, setSkillSuggestions] = useState(null);
  const [topJobs, setTopJobs] = useState([]);     // top 5 jobs
  const [totalSaved, setTotalSaved] = useState(0);
  const [resumeId, setResumeId] = useState(null);

  useEffect(() => {
    const savedResult = sessionStorage.getItem("latestUploadResult");
    if (savedResult) {
      try {
        const data = JSON.parse(savedResult);
        setAiResult(data.aiResult);
        setResumeScore(data.resumeScore);
        setSkillSuggestions(data.skillSuggestions);
        setTopJobs(data.topJobs);
        setTotalSaved(data.totalSaved);
      } catch (e) {
        console.error("Failed to parse saved upload result", e);
      }
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a resume file");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setAiResult(null);
    setTopJobs([]);

    try {
      const form = new FormData();
      form.append("resume", selectedFile);

      const resp = await api.post("/api/resume/upload", form);
      const data = resp.data;

      // Save to recent uploads list (localStorage)
      const resumes = JSON.parse(localStorage.getItem("resumes")) || [];
      resumes.push({
        name: selectedFile.name,
        email: localStorage.getItem("email") || "",
        date: new Date().toLocaleDateString(),
        status: "Parsed",
      });
      localStorage.setItem("resumes", JSON.stringify(resumes));

      setAiResult(data.parsedData);
      setResumeScore(data.resumeScore || null);
      setSkillSuggestions(data.skillSuggestions || null);
      setTopJobs(data.topJobs || []);
      setTotalSaved(data.totalSaved || 0);
      setResumeId(data.resume?._id || null);
      setSelectedFile(null);

      // Save to job history
      const resumeSnippet = `Skills: ${(data.parsedData?.skills || []).join(', ')} | Education: ${(data.parsedData?.education || []).join(', ')}`;
      const saved = saveJobHistory(data.topJobs || [], resumeSnippet);

      // Save to session storage so it persists when navigating back
      sessionStorage.setItem("latestUploadResult", JSON.stringify({
        aiResult: data.parsedData,
        resumeScore: data.resumeScore || null,
        skillSuggestions: data.skillSuggestions || null,
        topJobs: data.topJobs || [],
        totalSaved: data.totalSaved || 0
      }));

      if (saved) {
        alert("Job recommendations saved to history!");
      }

    } catch (e) {
      setUploadError(e.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="p-8 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
          📄 Upload Resume
        </h1>
        <p className="text-gray-500 mb-6">
          Upload your resume to get AI-powered job recommendations
        </p>

        {/* ── Upload + Guidelines ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Select Your Resume</h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose a PDF or DOCX file. Max size 5MB.
            </p>

            <label className="border-2 border-dashed border-blue-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50">
              <span className="text-4xl mb-2">⬆️</span>
              <p className="font-medium">Drag & Drop your resume here</p>
              <p className="text-sm text-gray-500">or click to browse files</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </label>

            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedFile.name}
              </p>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading & Analysing..." : "Upload Resume"}
            </button>

            {uploadError && (
              <p className="mt-3 text-sm text-red-600">{uploadError}</p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold mb-3">📌 Upload Guidelines</h3>
            <ul className="text-sm space-y-2">
              <li className="text-green-600">✔ PDF or DOC format</li>
              <li className="text-green-600">✔ File under 5MB</li>
              <li className="text-green-600">✔ Include skills & experience</li>
              <li className="text-red-500">✖ Avoid images & complex formatting</li>
            </ul>
          </div>
        </div>

        {/* ── AI Parse Result ───────────────────────────────────────────────── */}
        {aiResult && (
          <div className="bg-white p-6 rounded-xl shadow mt-8">
            <h3 className="font-bold mb-4 text-lg">✅ AI Parsed Result</h3>

            {aiResult.error ? (
              <p className="text-red-500 text-sm">Parser error: {aiResult.error}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-2">Parsed Fields</p>

                    {aiResult.name && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 uppercase">Name</p>
                        <p className="text-sm font-medium">{aiResult.name}</p>
                      </div>
                    )}
                    {aiResult.email && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 uppercase">Email</p>
                        <p className="text-sm">{aiResult.email}</p>
                      </div>
                    )}
                    {aiResult.phone && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 uppercase">Phone</p>
                        <p className="text-sm">{aiResult.phone}</p>
                      </div>
                    )}

                    {aiResult.skills?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 uppercase mb-1">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.skills.map((sk, i) => (
                            <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiResult.experience?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 uppercase mb-1">Experience</p>
                        {aiResult.experience.map((exp, i) => (
                          <div key={i} className="text-sm text-gray-700 mb-1 border-l-2 border-blue-300 pl-2">
                            {typeof exp === "string" ? exp : `${exp.title || ""} at ${exp.company || ""}`}
                          </div>
                        ))}
                      </div>
                    )}

                    {aiResult.education?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 uppercase mb-1">Education</p>
                        {aiResult.education.map((edu, i) => (
                          <div key={i} className="text-sm text-gray-700 mb-1 border-l-2 border-green-300 pl-2">
                            {typeof edu === "string" ? edu : `${edu.degree || ""} - ${edu.institution || ""}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {resumeScore && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <div className="flex flex-col md:flex-row gap-5 items-stretch">
                        <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm">
                          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-3">Resume Score</p>
                          <div className="flex items-end gap-4">
                            <div className="text-5xl font-bold text-slate-900">{resumeScore.overall}</div>
                            <div>
                              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Grade</div>
                              <div className={`mt-1 text-xl font-semibold ${resumeScore.overall >= 75 ? 'text-emerald-600' : resumeScore.overall >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {resumeScore.grade} · {resumeScore.label}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 grid gap-3">
                          {Object.entries(resumeScore.breakdown || {}).map(([key, value]) => {
                            const max = resumeScore.max_scores?.[key] || 1;
                            const pct = Math.round((value / max) * 100);
                            const label = key.charAt(0).toUpperCase() + key.slice(1);
                            return (
                              <div key={key}>
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                  <span>{label}</span>
                                  <span>{value}/{max}</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {resumeScore.tips?.length > 0 && (
                        <div className="mt-5">
                          <p className="text-sm font-semibold text-slate-700 mb-3">Improvement tips</p>
                          <div className="grid gap-3">
                            {resumeScore.tips.map((tip, index) => (
                              <div key={index} className="rounded-2xl border border-slate-200 p-3 bg-white">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{tip.dimension}</p>
                                    <p className="text-xs text-slate-500">{tip.issue}</p>
                                  </div>
                                  <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full ${tip.impact === 'high' ? 'bg-rose-100 text-rose-700' : tip.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {tip.impact}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{tip.fix}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Top 5 Job Recommendations ─────────────────────────────────────── */}
        {topJobs.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">🎯 Top Job Matches</h3>
                <p className="text-sm text-gray-500">
                  Showing top 5 of {totalSaved} jobs saved for you
                </p>
              </div>
              <button
                onClick={() => navigate("/jobs")}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                View all {totalSaved} jobs →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topJobs.map((job) => (
                <JobCard key={job._id || job.job_id} job={job} />
              ))}
            </div>
          </div>
        )}

        {skillSuggestions && (
          <div className="bg-white p-6 rounded-xl shadow mt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <h3 className="font-bold text-lg">📈 Skill Gap & Learning Plan</h3>
                <p className="text-sm text-gray-500">Recommended skills to learn next for {skillSuggestions.role}</p>
              </div>
              <div className="w-full md:w-2/5">
                <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">Readiness</div>
                <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div className={`h-full ${skillSuggestions.readiness >= 70 ? 'bg-emerald-500' : skillSuggestions.readiness >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${skillSuggestions.readiness}%` }} />
                </div>
                <p className="text-sm mt-2 text-gray-600">{skillSuggestions.readiness}% ready for {skillSuggestions.role} roles</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold mb-3">Your strengths</p>
                {skillSuggestions.strengths?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skillSuggestions.strengths.map((skill, index) => (
                      <span key={index} className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No core strengths detected yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold mb-3">Learn next</p>
                <div className="space-y-3">
                  {skillSuggestions.learn_next?.map((item, index) => (
                    <div key={index} className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex items-center text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full ${item.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.priority}
                        </span>
                        <p className="mt-2 font-medium text-slate-800">{item.skill}</p>
                        <p className="text-xs text-slate-500">{item.reason}</p>
                      </div>
                      <a
                        href={item.resource?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Learn →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state for jobs while upload is happening */}
        {isUploading && (
          <div className="bg-white p-6 rounded-xl shadow mt-8 text-center">
            <div className="animate-pulse text-gray-400">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm">Analysing resume & finding matching jobs...</p>
              <p className="text-xs text-gray-400 mt-1">This may take 15–30 seconds</p>
            </div>
          </div>
        )}


      </main>
    </div>
  );
}




