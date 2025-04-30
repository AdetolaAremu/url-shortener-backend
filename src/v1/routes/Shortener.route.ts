import {
  decodeURL,
  encodeURL,
  urlRedirection,
} from "../controllers/Shortener.controller";
import express from "express";

const router = express.Router();

router.post("/encode", encodeURL);
router.post("/decode", decodeURL);
router.get("/:url_path", urlRedirection);

export default router;
