import express from "express";
import { getCleanedData } from "../controllers/cleanedDataController.js";

const router = express.Router();

router.get("/cleaned-data/:id", getCleanedData);

export default router;
