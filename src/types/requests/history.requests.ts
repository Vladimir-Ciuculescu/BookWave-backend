import { Request } from "express";
import { ObjectId } from "mongoose";

export interface UpdateHistoryRequest extends Request {
  body: {
    audio: ObjectId;
    progress: string;
    date: Date;
  };
}

export interface RemoveHistoryRequest extends Request {
  query: {
    histories: string;
    all: "yes" | "no";
  };
}
