import express from "express";
import { requireAuth } from "../state.js";
import { toursController } from "../controllers/tours.controller.js";

const router = express.Router();

router.get("/tours", requireAuth, toursController.getTours);
router.post("/tours", requireAuth, toursController.createTour);
router.put("/tours/:id", requireAuth, toursController.updateTour);
router.delete("/tours/:id", requireAuth, toursController.deleteTour);

export default router;
