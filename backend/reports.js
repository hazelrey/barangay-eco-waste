import express from "express";
import Collection from "./models.js";

const router = express.Router();

router.get("/summary", async (req, res, next) => {
  try {
    const [statusSummary, wasteSummary, totalRecords] = await Promise.all([
      Collection.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            weightKg: { $sum: "$weightKg" }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Collection.aggregate([
        {
          $match: {
            status: "Collected"
          }
        },
        {
          $group: {
            _id: "$wasteType",
            count: { $sum: 1 },
            weightKg: { $sum: "$weightKg" }
          }
        },
        { $sort: { weightKg: -1 } }
      ]),
      Collection.countDocuments()
    ]);

    res.json({
      totalRecords,
      statusSummary,
      wasteSummary
    });
  } catch (error) {
    next(error);
  }
});

export default router;
