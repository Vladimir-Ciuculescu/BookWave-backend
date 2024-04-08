import { RequestHandler, Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, verify } from "jsonwebtoken";
import UserModel from "models/user.model";

export const isAuthenticatedMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  const secretKey = process.env.JWT_SECRET_KEY as jwt.Secret;

  try {
    const token = authorization!.split("Bearer=")[1];

    if (!token) {
      return res.status(403).json({ error: "Unauthorized access !" });
    }

    const payload = verify(token, secretKey) as JwtPayload;

    const { userId } = payload;

    //Check if the token from headers is the same with the one associated to the current user !
    const user = await UserModel.findOne({ _id: userId, tokens: token });

    if (!user) {
      return res.status(403).json({ error: "Unauthorized access !" });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
      followers: user.followers.length,
      followings: user.followings.length,
    };

    req.token = token;

    next();
  } catch (error: any) {
    console.log(error);
    res.status(422).json({ error: "Unauthorized access !" });
  }
};
