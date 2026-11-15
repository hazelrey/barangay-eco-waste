import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = process.env.PORT || 5000;
const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/barangay_eco_waste";

async function startServer() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    app.listen(port, "0.0.0.0", () => {
      console.log(`API running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

startServer();

async function shutdown() {
  await mongoose.connection.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
