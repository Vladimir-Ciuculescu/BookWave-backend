import { RequestHandler } from "express";

export interface AddUserRequest extends RequestHandler {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

export interface ChangePasswordRequest extends RequestHandler {
  // body: {
  //   password: string;
  //   userId: string;
  // };

  body: {
    email: string;
    password: string;
  };
}

export interface ForgotPasswordRequest extends RequestHandler {
  body: {
    email: string;
  };
}

export interface ReVerifyEmailRequest extends RequestHandler {
  body: {
    userId: string;
  };
}

export interface SignInRequest extends RequestHandler {
  body: {
    email: string;
    password: string;
  };
}

export interface VerifyEmailRequest extends RequestHandler {
  body: {
    token: string;
    userId: string;
  };
}

export interface VerifyPasswordResetTokenRequest extends RequestHandler {
  body: {
    token: string;
    userId: string;
  };
}

export interface IsUserVerifiedRequest extends Request {
  params: {
    userId: string;
  };
}
