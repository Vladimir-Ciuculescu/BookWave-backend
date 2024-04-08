import { NextFunction, Response } from "express";
import formidable from "formidable";
import { FilesRequest } from "../types/requests/files.request";

export const fileParserMiddleware = async (req: FilesRequest, res: Response, next: NextFunction) => {
  req.headers["content-type"];

  if (!req.headers["content-type"]?.startsWith("multipart/form-data")) {
    return res.status(422).json({
      error: "Format type not supported !",
    });
  }

  const form = formidable({ multiples: false });

  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err);
    }

    (req.body as any) = fields;
    req.files = files;

    next();
  });
};
