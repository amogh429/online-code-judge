import "dotenv/config";
import { connectDB } from "./utils/connectDB.js";
import Problem from "./models/Problem.js";

await connectDB();
const examples = [
  {
    title: "Sum of Two Numbers",
    slug: "sum-of-two-numbers",
    difficulty: "Easy",
    description: "Read two integers and print their sum.",
    inputFormat: "Two space-separated integers a and b.",
    outputFormat: "Print a + b.",
    constraints: ["-10^9 <= a, b <= 10^9"],
    supportedLanguages: ["javascript", "python", "cpp"],
    testcases: [
      { input: "2 3\n", expectedOutput: "5\n", isSample: true },
      { input: "10 20\n", expectedOutput: "30\n", isSample: false },
      { input: "-4 9\n", expectedOutput: "5\n", isSample: false },
    ],
  },
  {
    title: "Even or Odd",
    slug: "even-or-odd",
    difficulty: "Easy",
    description:
      "Read an integer and print EVEN if it is divisible by 2; otherwise print ODD.",
    inputFormat: "One integer n.",
    outputFormat: "Print EVEN or ODD.",
    constraints: ["-10^9 <= n <= 10^9"],
    supportedLanguages: ["javascript", "python", "cpp"],
    testcases: [
      { input: "8\n", expectedOutput: "EVEN\n", isSample: true },
      { input: "7\n", expectedOutput: "ODD\n", isSample: false },
    ],
  },
];
for (const p of examples)
  await Problem.updateOne({ slug: p.slug }, { $set: p }, { upsert: true });
console.log("Seeded example problems");
process.exit(0);
