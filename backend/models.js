import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    residentName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    purok: {
      type: String,
      required: true,
      trim: true
    },
    wasteType: {
      type: String,
      required: true,
      enum: [
        "Biodegradable",
        "Recyclable",
        "Residual",
        "Special Waste"
      ]
    },
    weightKg: {
      type: Number,
      required: true,
      min: 0
    },
    collectionDate: {
      type: Date,
      required: true
    },
    collectorName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Scheduled", "Collected", "Missed"],
      default: "Scheduled"
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

collectionSchema.index({ collectionDate: -1 });
collectionSchema.index({ purok: 1, wasteType: 1 });

export default mongoose.model("Collection", collectionSchema);
