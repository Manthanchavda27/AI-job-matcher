const UserJob = require("../models/UserJob");
const Job = require("../models/Job");

// GET /api/jobs/my - Get all jobs for the logged-in user (optionally filtered by resumeId)
const getMyJobs = async (req, res, next) => {
  try {
    const { resumeId } = req.query;
    const filter = { userId: req.user.id };
    if (resumeId) filter.resumeId = resumeId;

    const userJobs = await UserJob.find(filter)
      .populate("jobId")
      .sort({ createdAt: -1 });

    // Flatten into a list of jobs with match info
    const jobs = userJobs
      .filter((uj) => uj.jobId) // skip if job was deleted
      .map((uj) => ({
        userJobId: uj._id,
        resumeId: uj.resumeId,
        matchScore: uj.matchScore,
        matchedSkills: uj.matchedSkills,
        isSaved: uj.isSaved,
        isApplied: uj.isApplied,
        ...uj.jobId.toObject(),
      }));

    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/jobs/:userJobId/save - Toggle bookmark
const toggleSave = async (req, res, next) => {
  try {
    const userJob = await UserJob.findOne({
      _id: req.params.userJobId,
      userId: req.user.id,
    });

    if (!userJob) {
      return res.status(404).json({ error: "Not found" });
    }

    userJob.isSaved = !userJob.isSaved;
    await userJob.save();

    res.json({ isSaved: userJob.isSaved });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/jobs/:userJobId/apply - Mark as applied
const markApplied = async (req, res, next) => {
  try {
    const userJob = await UserJob.findOne({
      _id: req.params.userJobId,
      userId: req.user.id,
    });

    if (!userJob) {
      return res.status(404).json({ error: "Not found" });
    }

    userJob.isApplied = true;
    await userJob.save();

    res.json({ isApplied: userJob.isApplied });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/jobs/:userJobId/unapply - Unmark as applied
const unmarkApplied = async (req, res, next) => {
  try {
    const userJob = await UserJob.findOne({
      _id: req.params.userJobId,
      userId: req.user.id,
    });

    if (!userJob) {
      return res.status(404).json({ error: "Not found" });
    }

    userJob.isApplied = false;
    await userJob.save();

    res.json({ isApplied: userJob.isApplied });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyJobs, toggleSave, markApplied, unmarkApplied };
