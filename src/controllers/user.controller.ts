import crypto from "crypto";
import { Request, RequestHandler, Response } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import EmailVerificationTokenModel, { EmailVertificationTokenDocument } from "models/email-vertification.model";
import PasswordResetTokenModel, { PasswordResetTokenDocument } from "models/password-reset-token.model";
import UserModel, { UserDocument } from "models/user.model";
import { isValidObjectId } from "mongoose";
import path from "path";
import {
  AddUserRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  IsUserVerifiedRequest,
  ReVerifyEmailRequest,
  SignInRequest,
  VerifyEmailRequest,
  VerifyPasswordResetTokenRequest,
} from "types/requests/user.requests";
import { generateToken } from "utils/generateToken";
import { sendEmail } from "utils/sendEmail";
import cloudinary from "../cloud/cloud";
import { resetPasswordTemplate } from "../mail/reset-password.template";
import { verifyEmailTemplate } from "../mail/verify-email.template";

const addUser = async (req: AddUserRequest, res: Response) => {
  const { name, email, password } = req.body;

  const user = new UserModel<UserDocument>({
    name,
    email,
    password,
    verified: false,
    favorites: [],
    followers: [],
    followings: [],
    tokens: [],
  });

  try {
    const existentUser = await UserModel.findOne({ email });

    if (existentUser) {
      return res.status(422).json({ error: "Email address already in use !" });
    }

    const newUser = await UserModel.create<UserDocument>(user);

    const token = generateToken();

    const emailVerificationToken = new EmailVerificationTokenModel<EmailVertificationTokenDocument>({
      //@ts-ignore
      owner: newUser._id,
      token: token,
    });

    await EmailVerificationTokenModel.create<EmailVertificationTokenDocument>(emailVerificationToken);

    const logoImage = fs.readFileSync(path.join(__dirname, "../assets/logo.png"));
    const passwordResetImage = fs.readFileSync(path.join(__dirname, "../assets/password_reset.png"));

    const attachments = [
      {
        filename: "logo.png",
        content_id: "logo",
        disposition: "inline",
        content: logoImage,
        type: "image/png",
      },
      {
        filename: "password_reset.png",
        content_id: "password_reset",
        disposition: "inline",
        content: passwordResetImage,
        type: "image/png",
      },
    ];

    sendEmail(
      user.email,
      process.env.MAILTRAP_SENDER,
      "BookWave registration",
      verifyEmailTemplate({
        title: "Welcome to BookWave",
        message: "Welcome again",
        logo: "cid:logo",
        banner: "cid:password_reset",
        link: "#",
        btnTitle: token,
      }),
      attachments,
    );

    return res.status(201).json({
      user: newUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(422).json({
      error: error,
    });
  }
};

const getUsers = async (req: RequestHandler, res: Response) => {
  try {
    const users = await UserModel.find();

    return res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    return res.status(403).json({ error });
  }
};

const signIn = async (req: SignInRequest, res: Response) => {
  const secretKey = process.env.JWT_SECRET_KEY as jwt.Secret;
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: "The email or password are not correct !" });
    }

    const matchedPassword = await user.comparePassword(password);

    if (!matchedPassword) {
      return res.status(404).json({ error: "The email or password are not correct !" });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, secretKey);

    await user.updateOne({ tokens: [...user.tokens, token] });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        avatar: user.avatar,
        followers: user.followers.length,
        followings: user.followings.length,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const sendVerificationToken = async (req: VerifyEmailRequest, res: Response) => {
  const { token, userId } = req.body;

  try {
    const emailVerificationToken = await EmailVerificationTokenModel.findOne({
      owner: userId,
    });

    if (!emailVerificationToken) {
      return res.status(403).json({
        error: "Invalid token !",
      });
    }

    const validToken = await emailVerificationToken?.compareToken(token);

    if (!validToken) {
      return res.status(403).json({
        error: "Invalid token !",
      });
    }

    await UserModel.findByIdAndUpdate(userId, { verified: true });

    await EmailVerificationTokenModel.findByIdAndDelete(emailVerificationToken!._id);

    return res.status(201).json({ message: "Your email has been verified !" });
  } catch (error) {
    return res.status(422).json({
      error: "Invalid token !",
    });
  }
};

const resendVerificationToken = async (req: ReVerifyEmailRequest, res: Response) => {
  const { userId } = req.body;

  console.log(111, userId);

  try {
    if (!isValidObjectId(userId)) {
      return res.status(403).json({ error: "Invalid user Id" });
    }
    const user = await UserModel.findById(userId);

    console.log(222, user);

    if (user?.verified) {
      return res.status(200).json({ message: "This user already has their email verified !" });
    }

    await EmailVerificationTokenModel.findOneAndDelete({ owner: userId });

    if (!user) {
      return res.status(403).json({ error: "This user does not exist !" });
    }

    const token = generateToken();

    const emailVerificationToken = new EmailVerificationTokenModel<EmailVertificationTokenDocument>({
      //@ts-ignore
      owner: user?._id,
      token: token,
    });

    await EmailVerificationTokenModel.create<EmailVertificationTokenDocument>(emailVerificationToken);

    const logoImage = fs.readFileSync(path.join(__dirname, "../assets/logo.png"));
    const passwordResetImage = fs.readFileSync(path.join(__dirname, "../assets/password_reset.png"));

    const attachments = [
      {
        filename: "logo.png",
        content_id: "logo",
        disposition: "inline",
        content: logoImage,
        type: "image/png",
      },
      {
        filename: "password_reset.png",
        content_id: "password_reset",
        disposition: "inline",
        content: passwordResetImage,
        type: "image/png",
      },
    ];

    sendEmail(
      user!.email,
      process.env.MAILTRAP_SENDER,
      "Account verification",
      verifyEmailTemplate({
        title: "Account verification",
        message: "Welcome again",
        logo: "cid:logo",
        banner: "cid:password_reset",
        link: "#",
        btnTitle: token,
      }),
      attachments,
    );

    return res.status(201).json({
      message: "Token verification re-sent. Please check your email !",
    });
  } catch (error) {
    console.log(error);
    return res.status(422).json({
      error: error,
    });
  }
};

const forgotPassword = async (req: ForgotPasswordRequest, res: Response) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User does not exist !" });
    }

    await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

    const token = crypto.randomBytes(36).toString("hex");

    const passwordResetToken = new PasswordResetTokenModel<PasswordResetTokenDocument>({
      //@ts-ignore
      owner: user._id,
      token,
    });

    await PasswordResetTokenModel.create<PasswordResetTokenDocument>(passwordResetToken);

    const baseLink = process.env.PASSWORD_RESET_LINK;

    const passwordResetLink = `${baseLink}?token=${token}?userId=${user._id}`;

    sendEmail(
      user!.email,
      "vladimir.ciuculescu@gmail.com",
      "Reset password Link",
      resetPasswordTemplate({
        title: "Reset password",
        message: "It looks like you forgot your password. Use the link below to create a new one",
        logo: "cid:logo",
        banner: "cid:password_reset",
        link: passwordResetLink,
        btnTitle: "Reset password",
      }),
      [
        {
          filename: "logo.png",
          path: path.join(__dirname, "../assets/logo.png"),
          cid: "logo",
        },
        {
          filename: "password_reset.png",
          path: path.join(__dirname, "../assets/password_reset.png"),
          cid: "password_reset",
        },
      ],
    );

    return res.status(201).json({ link: passwordResetLink });
  } catch (error) {
    console.log(error);
    return res.status(422).json({
      error: error,
    });
  }
};

const verifyPasswordResetToken = async (req: VerifyPasswordResetTokenRequest, res: Response) => {
  return res.status(201).json({ message: "Your token is valid !" });
};

const changePassword = async (req: ChangePasswordRequest, res: Response) => {
  // const { password, userId } = req.body;

  // try {
  //   const user = await UserModel.findById(userId);

  //   if (!user) {
  //     return res.status(404).json({ error: "User not found !" });
  //   }

  //   const isTheSamePassword = await user.comparePassword(password);

  //   if (isTheSamePassword) {
  //     return res.status(422).json({ error: "The new password cannot be the same as the old one !" });
  //   }

  //   await PasswordResetTokenModel.findByIdAndDelete(userId);

  //   await user.updateOne({ password: password });

  //   // TODO Send email that password was changed

  //   return res.status(201).json({ message: "Password was succesfully changed !" });
  // } catch (error) {
  //   console.log(error);
  //   return res.status(422).json({ error: error });
  // }

  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "This user does not exist !" });
  }

  await UserModel.findOneAndUpdate({ _id: user._id }, { password: password });

  return res.status(200).json({ message: "Password changed succesfully !" });

  try {
    await UserModel.findByIdAndUpdate();
  } catch (error) {}
};

const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, email } = req.body;

    const avatar = req.files?.avatar;
    const userId = req.user.id;

    const nameJson = JSON.stringify(name);
    const emailJson = JSON.stringify(email);

    const nameString = nameJson.substring(1, nameJson.length - 1);
    const emailString = emailJson.substring(1, emailJson.length - 1);

    const nameValue = nameString.replace(/"/g, "");
    const emailValue = emailString.replace(/"/g, "");

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error("User not found !");
    }

    if (nameString.trim().length < 3) {
      return res.status(422).json({ error: "Invalid name !" });
    }

    if (avatar) {
      if (user.avatar?.publicId) {
        await cloudinary.uploader.destroy(user.avatar.publicId);
      }

      const { public_id, secure_url } = await cloudinary.uploader.upload(avatar[0].filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      });

      await user.updateOne({ name: nameValue, email: emailValue, avatar: { url: secure_url, publicId: public_id } });
      return res.status(200).json({ avatar: user.avatar });
    }
  } catch (error: any) {
    console.log(error);

    if (error.message && error.message.includes("File size too large")) {
      return res.status(422).json({ error: "Image size is too big !" });
    }

    return res.status(422).json({ error: req.files.avatar[0].filepath });
  }
};

const isVerified = async (req: IsUserVerifiedRequest, res: Response) => {
  const { userId } = req.params;

  try {
    if (!isValidObjectId(userId)) {
      return res.status(422).json({ error: "Invalid user id" });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found !" });
    }

    return res.status(200).json(user.verified);
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const logOut = async (req: Request, res: Response) => {
  const { fromAll } = req.query;
  const token = req.token;
  console.log();

  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found !" });
    }

    let tokens;
    let message;

    if (fromAll === "yes") {
      tokens = [];
      message = "Succesfully log out from all devices !";
    } else if (fromAll === "no" || !fromAll) {
      tokens = user.tokens.filter((tokenItem) => tokenItem !== token);
      message = "Succesfully log out !";
    }
    await user.updateOne({ tokens: tokens });

    return res.status(201).json({ message: message });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const UserController = {
  addUser,
  signIn,
  getUsers,
  sendVerificationToken,
  resendVerificationToken,
  forgotPassword,
  verifyPasswordResetToken,
  changePassword,
  updateProfile,
  isVerified,
  logOut,
};

export default UserController;
