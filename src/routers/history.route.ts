import { Router } from "express";
import HistoryController from "../controllers/history.controller";
import { isAuthenticatedMiddleware } from "../middlewares/is-authenticated.middleware";
import { isVerifiedMiddleware } from "../middlewares/is-verified.middleware";
import { validateMiddleware } from "../middlewares/validate.middleware";
import { historySchema } from "../yup/historty.schemas";

const router: any = Router();

router.post("/", isAuthenticatedMiddleware, isVerifiedMiddleware, validateMiddleware(historySchema), HistoryController.updateHistory);

router.delete("/", isAuthenticatedMiddleware, isVerifiedMiddleware, HistoryController.removeHistory);

router.get("/", isAuthenticatedMiddleware, isVerifiedMiddleware, HistoryController.getHistories);

router.get("/recently-played", isAuthenticatedMiddleware, isVerifiedMiddleware, HistoryController.getRecentlyPlayed);

export default router;
