import { Router } from "express";
import Submission from "../models/Submission.js";
const router = Router();
router.get("/", async (_req, res, next) => {
  try {
    const rows = await Submission.aggregate([
      { $match: { status: "Accepted" } },
      {
        $group: {
          _id: "$user",
          solved: { $addToSet: "$problem" },
          acceptedSubmissions: { $sum: 1 },
        },
      },
      { $project: { solved: { $size: "$solved" }, acceptedSubmissions: 1 } },
      { $sort: { solved: -1, acceptedSubmissions: 1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          username: "$user.username",
          solved: 1,
          acceptedSubmissions: 1,
        },
      },
    ]);
    res.json({ leaderboard: rows });
  } catch (err) {
    next(err);
  }
});
export default router;
