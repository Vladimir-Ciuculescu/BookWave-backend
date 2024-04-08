import { Request } from "express";
import { Files } from "formidable";

export interface FilesRequest extends Request {
  files?: Files;
}
