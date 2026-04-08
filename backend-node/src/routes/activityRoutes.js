import express from "express";
import { getActivityLogs, getActivityStats } from "../controllers/activityController.js";

const router = express.Router();

router.get("/activity-logs", getActivityLogs);
router.get("/activity-stats", getActivityStats);

export default router;