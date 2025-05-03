// app.ts
import * as dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import bodyParser from "body-parser";
import sanitizeHtml from "sanitize-html";
import shortenedRoute from "./src/v1/routes/Shortener.route";
import appError from "./src/v1/utils/AppError";
import globalErrorHandler from "./src/v1/utils/GlobalErrorHandler";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ credentials: true, origin: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ limit: "10kb" }));

app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      req.body[key] = sanitizeHtml(req.body[key]);
    }
  }
  next();
});

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);
app.use("/api/v1", shortenedRoute);

app.use("/*splat", (req: Request, res: Response, next: NextFunction) => {
  next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
