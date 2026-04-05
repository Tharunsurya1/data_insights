import express from "express";
import { getCleanedData, getOriginalData } from "../controllers/cleanedDataController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

router.get("/cleaned-data/:id", protect, getCleanedData);
router.get("/original-data/:id", protect, getOriginalData);

export default router;
