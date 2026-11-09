import { Router } from "express";
import Problem from "../models/Problem.js";
import { protect } from "../middleware/auth.js";
import { executeCode, normalizeOutput } from "../services/judge0.js";

const router = Router();
router.get("/", async (_req, res, next) => {
  try {
    const problems = await Problem.find()
      .select("title slug difficulty description")
      .sort({ createdAt: 1 });
    res.json({ problems });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json({
      problem: {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        description: problem.description,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        supportedLanguages: problem.supportedLanguages,
        testcases: problem.testcases
          .filter((t) => t.isSample)
          .map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
      },
    });
  } catch (err) {
    next(err);
  }
});
router.post("/:id/run", protect, async (req, res, next) => {
  try {
    const { sourceCode, language, stdin = "" } = req.body;
    if (!sourceCode || !language)
      return res
        .status(400)
        .json({ message: "sourceCode and language are required" });
    const result = await executeCode({ sourceCode, language, stdin });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
export default router;
