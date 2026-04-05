import express from "express";
import {
  analyticsSummary,
  analyticsChart
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/", analyticsSummary);
router.post("/summary", analyticsSummary);
router.post("/chart", analyticsChart);

export default router;
