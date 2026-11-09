import mongoose from "mongoose";
const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "Queued",
        "Processing",
        "Accepted",
        "Wrong Answer",
        "Compilation Error",
        "Runtime Error",
        "Time Limit Exceeded",
        "Failed",
      ],
      default: "Queued",
    },
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    executionTime: String,
    memory: String,
    errorMessage: String,
  },
  { timestamps: true },
);
export default mongoose.model("Submission", submissionSchema);
