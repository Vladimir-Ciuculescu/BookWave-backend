import { ObjectId, Schema, Types } from "mongoose";

export interface History {
  audio: ObjectId;
  progress: number;
  date: Date;
  _id: Types.ObjectId;
}
