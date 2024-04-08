import mongoose, { Model, ObjectId, Schema, models } from "mongoose";
import { History } from "types/common/History";

// ? Interface
export interface HistoryDocument {
  owner: ObjectId;
  last: History;
  all: History[];
}

// ? Schema
const historySchema = new Schema<HistoryDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    last: {
      type: Object,
      audio: {
        type: Schema.Types.ObjectId,
        ref: "Audio",
      },
      progress: Number,
      date: {
        type: Date,
        required: true,
      },
    },

    all: [
      {
        audio: { type: Schema.Types.ObjectId, ref: "Audio" },
        progress: Number,
        date: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

// ? Model
const HistoryModel = models.History || mongoose.model("History", historySchema);

export default HistoryModel as Model<HistoryDocument>;
