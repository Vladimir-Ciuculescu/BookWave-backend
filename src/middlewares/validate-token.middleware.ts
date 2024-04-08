import { RequestHandler, Request, Response, NextFunction } from "express";
import PasswordResetTokenModel from "models/password-reset-token.model";

export const validateTokenMiddleware = (): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { token, userId } = req.body;
    try {
      const passwordResetToken = await PasswordResetTokenModel.findOne({ owner: userId });

      if (!passwordResetToken) {
        return res.status(403).json({ error: "Invalid tokennn !" });
      }

      const validToken = passwordResetToken.compareToken(token);

      if (!validToken) {
        return res.status(403).json({ error: "Invalid tokenawawdd !" });
      }

      next();
    } catch (error) {
      console.log(error);
      return res.status(422).json({ error: error });
    }
  };
};
