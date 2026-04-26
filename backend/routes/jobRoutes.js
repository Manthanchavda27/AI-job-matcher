const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getMyJobs, toggleSave, markApplied, unmarkApplied } = require("../controllers/jobController");

const router = express.Router();

// GET all saved jobs for logged-in user, grouped by location
// Query params: ?resumeId=xxx&groupBy=city|state|country
router.get("/my", protect, getMyJobs);

// Toggle bookmark
router.patch("/:userJobId/save", protect, toggleSave);

// Mark as applied
router.patch("/:userJobId/apply", protect, markApplied);

// Unmark as applied
router.patch("/:userJobId/unapply", protect, unmarkApplied);

module.exports = router;








// const express = require("express");
// const { protect, adminOnly } = require("../middleware/authMiddleware");
// const Job = require("../models/Job");

// const router = express.Router();

// // GET /api/jobs - list active jobs with optional filters
// router.get("/", protect, async (req, res, next) => {
//   try {
//     const { type, location } = req.query;
//     const filter = { status: "Active" };

//     if (type) filter.type = type;
//     if (location) filter.location = location;

//     const jobs = await Job.find(filter).sort({ createdAt: -1 });
//     res.json(jobs);
//   } catch (err) {
//     next(err);
//   }
// });

// // POST /api/jobs - create job (admin only)
// router.post("/", protect, adminOnly, async (req, res, next) => {
//   try {
//     const { title, company, location, type, salary, skills, description } =
//       req.body;

//     const job = await Job.create({
//       title,
//       company,
//       location,
//       type,
//       salary,
//       skills: Array.isArray(skills)
//         ? skills
//         : String(skills || "")
//             .split(",")
//             .map((s) => s.trim())
//             .filter(Boolean),
//       description,
//       postedBy: req.user.id,
//     });

//     res.status(201).json(job);
//   } catch (err) {
//     next(err);
//   }
// });

// // PUT /api/jobs/:id - update job (admin only)
// router.put("/:id", protect, adminOnly, async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const data = req.body;

//     if (data.skills) {
//       data.skills = Array.isArray(data.skills)
//         ? data.skills
//         : String(data.skills)
//             .split(",")
//             .map((s) => s.trim())
//             .filter(Boolean);
//     }

//     const job = await Job.findByIdAndUpdate(id, data, {
//       new: true,
//       runValidators: true,
//     });

//     if (!job) {
//       return res.status(404).json({ message: "Job not found" });
//     }

//     res.json(job);
//   } catch (err) {
//     next(err);
//   }
// });

// // DELETE /api/jobs/:id - delete job (admin only)
// router.delete("/:id", protect, adminOnly, async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const job = await Job.findByIdAndDelete(id);
//     if (!job) {
//       return res.status(404).json({ message: "Job not found" });
//     }
//     res.json({ message: "Job deleted" });
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;

