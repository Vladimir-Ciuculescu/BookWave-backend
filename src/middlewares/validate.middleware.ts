import { NextFunction, Request, RequestHandler, Response } from "express";
import { convertFormData } from "utils/convertFormData";
import * as Yup from "yup";

export const validateMiddleware = (schema: any): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let body = req.body;

    if (req.headers["content-type"]?.startsWith("multipart/form-data;")) {
      const jsonData = convertFormData(body);

      body = jsonData;
      req.body = body;
    }
    if (!req.body) {
      return res.status(422).json({ error: "The request has no attached body !" });
    }

    const schemaToValidate = Yup.object({ body: schema });

    try {
      await schemaToValidate.validate(
        {
          body: req.body,
        },
        { abortEarly: true },
      );
      next();
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(422).json({ error: error.message });
      }
    }
  };
};
