// server.ts
import http from "http";
import app from "./index";

const port = process.env.PORT || 3001;
const server: http.Server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}) as http.Server;

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
