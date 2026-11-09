import { Router } from "express";
import { Queue } from "bullmq";
import { connection } from "../utils/redis.js";
import { protect } from "../middleware/auth.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";

const router = Router();
const queue = new Queue("submissions", { connection });

router.post("/", protect, async (req, res, next) => {
  try {
    const { problemId, sourceCode, language } = req.body;
    if (!problemId || !sourceCode || !language)
      return res
        .status(400)
        .json({ message: "problemId, sourceCode, and language are required" });
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    if (!problem.supportedLanguages.includes(language))
      return res
        .status(400)
        .json({ message: "Language is not supported for this problem" });
    const submission = await Submission.create({
      user: req.user._id,
      problem: problem._id,
      sourceCode,
      language,
      totalTests: problem.testcases.length,
    });
    await queue.add(
      "evaluate",
      { submissionId: String(submission._id) },
      {
        attempts: 2,
        backoff: { type: "exponential", delay: 1500 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );
    res.status(202).json({ submission });
  } catch (err) {
    next(err);
  }
});
router.get("/mine", protect, async (req, res, next) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .populate("problem", "title slug difficulty")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ submissions });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", protect, async (req, res, next) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("problem", "title slug difficulty");
    if (!submission)
      return res.status(404).json({ message: "Submission not found" });
    res.json({ submission });
  } catch (err) {
    next(err);
  }
});
export default router;
