import "dotenv/config";
import { Worker } from "bullmq";
import { connectDB } from "../utils/connectDB.js";
import { connection } from "../utils/redis.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { executeCode, normalizeOutput } from "../services/judge0.js";

await connectDB();
const worker = new Worker(
  "submissions",
  async (job) => {
    const submission = await Submission.findById(job.data.submissionId);
    if (!submission) return;
    submission.status = "Processing";
    await submission.save();

    const problem = await Problem.findById(submission.problem);
    if (!problem) {
      submission.status = "Failed";
      submission.errorMessage = "Problem no longer exists";
      await submission.save();
      return;
    }

    let passed = 0;
    let finalStatus = "Accepted";
    for (const testcase of problem.testcases) {
      try {
        const result = await executeCode({
          sourceCode: submission.sourceCode,
          language: submission.language,
          stdin: testcase.input,
        });
        if (result.status === "Compilation Error") {
          finalStatus = "Compilation Error";
          submission.errorMessage = result.compileOutput || result.stderr;
          break;
        }
        if (result.status === "Time Limit Exceeded") {
          finalStatus = "Time Limit Exceeded";
          break;
        }
        if (result.status !== "Accepted") {
          finalStatus = "Runtime Error";
          submission.errorMessage = result.stderr || result.status;
          break;
        }
        if (
          normalizeOutput(result.stdout) !==
          normalizeOutput(testcase.expectedOutput)
        ) {
          finalStatus = "Wrong Answer";
          break;
        }
        passed += 1;
        submission.executionTime =
          result.time == null ? undefined : String(result.time);
        submission.memory =
          result.memory == null ? undefined : String(result.memory);
      } catch (err) {
        finalStatus = "Failed";
        submission.errorMessage = err.message;
        break;
      }
    }
    submission.passedTests = passed;
    submission.totalTests = problem.testcases.length;
    submission.status = finalStatus;
    await submission.save();
  },
  { connection, concurrency: 3 },
);

worker.on("completed", (job) =>
  console.log(`Submission job ${job.id} completed`),
);
worker.on("failed", (job, err) =>
  console.error(`Submission job ${job?.id} failed:`, err.message),
);
console.log("Submission worker started");
