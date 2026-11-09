import mongoose from "mongoose";
const testcaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isSample: { type: Boolean, default: false },
  },
  { _id: false },
);

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },
  description: { type: String, required: true },
  inputFormat: String,
  outputFormat: String,
  constraints: [String],
  supportedLanguages: {
    type: [String],
    default: ["javascript", "python", "cpp"],
  },
  testcases: [testcaseSchema],
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model("Problem", problemSchema);
