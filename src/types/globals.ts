export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGO_URL: string;
      PORT: number;
      MAILTRAP_USER: string;
      MAILTRAP_PASSWORD: string;
      PASSWORD_RESET_LINK: string;
      JWT_SECRET_KEY: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_SECRET_KEY: string;
      MAILTRAP_TOKEN: string;
      MAILTRAP_SENDER: string;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      user: {
        id: any;
        name: string;
        email: string;
        verified: boolean;
        avatar?: string;
        followers: number;
        followings: number;
      };
      token: string;
    }
  }
}
