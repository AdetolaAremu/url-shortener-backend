import {
  decodeURL,
  encodeURL,
  urlRedirection,
  urlStatistics,
} from "../controllers/Shortener.controller";
import express from "express";

const router = express.Router();

router.post("/encode", encodeURL);
router.post("/decode", decodeURL);
router.get("/:url_path", urlRedirection);
router.get("/statistic/:shortCode", urlStatistics);

export default router;
