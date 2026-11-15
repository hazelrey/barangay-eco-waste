import express from "express";
import Collection from "./models.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { status, wasteType, purok, from, to } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (wasteType) filter.wasteType = wasteType;
    if (purok) filter.purok = purok;

    if (from || to) {
      filter.collectionDate = {};
      if (from) filter.collectionDate.$gte = new Date(from);
      if (to) filter.collectionDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const records = await Collection.find(filter)
      .sort({ collectionDate: -1 })
      .limit(500);

    res.json(records);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const record = await Collection.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const record = await Collection.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!record) {
      return res.status(404).json({ message: "Collection record not found." });
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const record = await Collection.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Collection record not found." });
    }

    res.json({ message: "Collection record deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;
