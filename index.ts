import * as dotenv from "dotenv";
import express from "express";
import http from "http";
import { NextFunction, Response, Request } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import cors from "cors";
import bodyParser from "body-parser";
import appError from "v1/utils/AppError";
import globalErrorHandler from "v1/utils/GlobalErrorHandler";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ credentials: true, origin: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ limit: "10kb" }));

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);

app.use(xss());

// Your routes would go here
// app.use('/api/v1/users', userRouter);

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  next(new appError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

const port = process.env.PORT || 3001;
const server: http.Server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message, err.stack);
  console.log("UNCAUGHT EXCEPTION shutting down 💥");
  process.exit(1);
});

process.on("unhandledRejection", (err: Error) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION shutting down 💥");
  server.close(() => {
    process.exit(1);
  });
});
