import express from "express";
import {
  getAllDatasets,
  getDatasetById,
  getDatasetStatus,
  updateDatasetStatus,
  cleanDataset,
  trainDataset,
  getAnalysis,
  getMetrics,
  getDashboardConfig,
  deleteDataset,
} from "../controllers/datasetController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

/* =====================================================
   DATASET MANAGEMENT
   All routes require authentication
 ===================================================== */

// Get all datasets
router.get("/datasets", protect, getAllDatasets);

// Get dataset by ID
router.get("/datasets/:id", protect, getDatasetById);

// Get dataset status
router.get("/dataset-status/:id", protect, getDatasetStatus);

// Update dataset status (admin / debug)
router.patch("/datasets/:id/status", protect, updateDatasetStatus);

// Delete dataset
router.delete("/datasets/:id", protect, deleteDataset);

/* =====================================================
   ML PIPELINE AUTOMATION
===================================================== */

// Clean dataset (Python script)
router.post("/datasets/:id/clean", protect, cleanDataset);

// Train ML model (Python script)
router.post("/datasets/:id/train", protect, trainDataset);

// Get data analysis report
router.get("/datasets/:id/analysis", protect, getAnalysis);

// Get trained model metrics
router.get("/datasets/:id/metrics", protect, getMetrics);

// Get dashboard configuration (charts, insights, KPIs)
router.get("/dashboard/:id", getDashboardConfig);

export default router;
