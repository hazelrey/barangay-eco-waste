import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import collectionRoutes from "./routes.js";
import reportRoutes from "./reports.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, "../frontend/dist");

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || "*"
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Barangay Eco-Waste API"
  });
});
app.use("/api/collections", collectionRoutes);
app.use("/api/reports", reportRoutes);

app.use(express.static(frontendDist));

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Endpoint not found." });
  }
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(" ")
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid record ID." });
  }

  res.status(500).json({
    message: "An internal server error occurred."
  });
});

export default app;
