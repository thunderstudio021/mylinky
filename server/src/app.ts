import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Segurança
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Rate limiting global
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Rotas
app.use("/api", router);

// Erro centralizado
app.use(errorHandler);
