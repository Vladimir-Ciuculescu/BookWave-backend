import { Router } from "express";
import FavoriteController from "../controllers/favorite.controller";
import { isAuthenticatedMiddleware } from "../middlewares/is-authenticated.middleware";
import { isVerifiedMiddleware } from "../middlewares/is-verified.middleware";

const router: any = Router();

router.post("/toggle", isAuthenticatedMiddleware, isVerifiedMiddleware, FavoriteController.toggleFavoriteAudio);

router.get("/", isAuthenticatedMiddleware, isVerifiedMiddleware, FavoriteController.getFavorites);

router.get("/is-favorite", isAuthenticatedMiddleware, FavoriteController.getIsFavorite);

router.get("/total-count", isAuthenticatedMiddleware, isVerifiedMiddleware, FavoriteController.getFavoritesTotalCount);

export default router;
