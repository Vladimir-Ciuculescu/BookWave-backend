import AudioController from "../controllers/audio.controller";
import { Router } from "express";
import { fileParserMiddleware } from "../middlewares/file-parser.middleware";
import { isAuthenticatedMiddleware } from "../middlewares/is-authenticated.middleware";
import { validateMiddleware } from "../middlewares/validate.middleware";
import { audioSchema } from "../yup/audio.schemas";
import { isVerifiedMiddleware } from "../middlewares/is-verified.middleware";

const router: any = Router();

router.post(
  "/add",
  isAuthenticatedMiddleware,
  isVerifiedMiddleware,
  fileParserMiddleware,
  validateMiddleware(audioSchema),
  AudioController.addAudioFile,
);

router.patch(
  "/update/:audioId",
  isAuthenticatedMiddleware,
  isVerifiedMiddleware,
  fileParserMiddleware,
  validateMiddleware(audioSchema),
  AudioController.updateAudioFile,
);

router.get("/latest", AudioController.getLatestUploads);

export default router;
