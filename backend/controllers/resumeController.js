const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const Resume = require("../models/Resume"); // ✅ FIX 1
const Job = require("../models/Job");
const UserJob = require("../models/UserJob");

// Upload Resume
const uploadResume = async (req, res, next) => {
  try {
    console.log("FILE RECEIVED:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    // Send file to FastAPI
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    console.log(`[AI SERVICE INFO] Calling AI backend at: ${aiServiceUrl}/parse`);

    const response = await axios.post(
      `${aiServiceUrl}/parse`,
      formData,
      {
        headers: { ...formData.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const parsedData = response.data?.parsedData || response.data || {};
    const resumeScore = response.data?.resumeScore || {};

    // ✅ FIX 2: Save in MongoDB
    const resume = await Resume.create({
      userId: req.user.id,
      fileName: req.file.filename,
      filePath: req.file.path,
      originalName: req.file.originalname,
      parsedData,
      resumeScore,
      status: "Active",
    });

    console.log("STEP 2 ✅ Resume saved, id:", resume._id);

    // Enforce max 5 sessions per user (delete oldest sessions beyond the 5 most recent)
    const allResumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: 1 });
    if (allResumes.length > 5) {
      const toDelete = allResumes.slice(0, allResumes.length - 5);
      for (const oldResume of toDelete) {
        await UserJob.deleteMany({ resumeId: oldResume._id });
        await Resume.deleteOne({ _id: oldResume._id });
        console.log("Auto-deleted old session:", oldResume.originalName, oldResume._id.toString());
      }
    }

    // STEP 3: Get job recommendations
    const recommendResponse = await axios.post(
      `${aiServiceUrl}/recommend`,
      { parsed_resume: parsedData },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const { top5, all_jobs, skill_suggestions } = recommendResponse.data;
    console.log("STEP 3 ✅ top5:", top5.length, "all_jobs:", all_jobs.length, "skill_suggestions:", !!skill_suggestions);

    // STEP 4: Save jobs to MongoDB
    let savedCount = 0;
    console.log("💾 SAVING JOBS TO DATABASE:");
    for (let i = 0; i < Math.min(all_jobs.length, 10); i++) {
      const jobData = all_jobs[i];

      // Upsert Job
      const job = await Job.findOneAndUpdate(
        { title: jobData.job_title || jobData.title || "", company: jobData.company, url: jobData.url },
        {
          title: jobData.job_title || jobData.title || "",
          company: jobData.company,
          url: jobData.url,
          location: jobData.location || "",
          city: jobData.city || "",
          state: jobData.state || "",
          country: jobData.country || "",
          isRemote: jobData.isRemote || false,
          isHybrid: jobData.isHybrid || false,
          seniority: jobData.seniority || "",
          salary: jobData.salary || "",
          skills: jobData.skills || [],
          description: jobData.description || "",
          datePosted: jobData.datePosted || "",
          status: "Active",
        },
        { upsert: true, new: true }
      );

      // Upsert UserJob
      await UserJob.findOneAndUpdate(
        { userId: req.user.id, jobId: job._id, resumeId: resume._id },
        {
          userId: req.user.id,
          jobId: job._id,
          resumeId: resume._id,
          matchScore: jobData.matchScore || 0,
          matchedSkills: jobData.matchedSkills || [],
          isSaved: false,
          isApplied: false,
        },
        { upsert: true, new: true }
      );

      console.log(`  Job ${i + 1}: ${jobData.title || jobData.job_title} at ${jobData.company} - Match Score: ${jobData.match_score}%`);

      savedCount++;
    }

    console.log("STEP 4 ✅ Saved", savedCount, "jobs");

    // STEP 5: Return response
    const topJobsToReturn = top5.slice(0, 5);
    console.log("📊 TOP 5 JOB RECOMMENDATIONS:");
    topJobsToReturn.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title || job.job_title} at ${job.company} - Match Score: ${job.match_score}%`);
    });

    res.status(201).json({
      message: "Resume uploaded, parsed, and jobs recommended successfully",
      parsedData: parsedData,
      resumeScore,
      topJobs: topJobsToReturn,
      skillSuggestions: skill_suggestions || {},
      totalSaved: savedCount,
    });

  } catch (error) {
    console.error("FASTAPI ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
};

// Get My Resumes
const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(resumes);
  } catch (err) {
    next(err);
  }
};

const deleteResumeHistory = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ error: "Not found" });
    }

    await UserJob.deleteMany({ resumeId: resume._id });
    await Resume.deleteOne({ _id: resume._id });

    return res.json({ message: "History deleted", resumeId: resume._id });
  } catch (err) {
    next(err);
  }
};

const deleteAllResumeHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const resumes = await Resume.find({ userId }).select("_id");
    const resumeIds = resumes.map((r) => r._id);

    await UserJob.deleteMany({ resumeId: { $in: resumeIds } });
    const { deletedCount } = await Resume.deleteMany({ userId });

    return res.json({
      message: "All history cleared",
      deletedResumes: deletedCount,
      deletedResumeIds: resumeIds,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadResume, getMyResumes, deleteResumeHistory, deleteAllResumeHistory };