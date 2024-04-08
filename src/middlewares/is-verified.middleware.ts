import { NextFunction, Request, Response } from "express";

export const isVerifiedMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isUserVerified = req.user.verified;

    if (!isUserVerified) {
      return res.status(422).json({ error: "Please verify your email address !" });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error: error });
  }
};
