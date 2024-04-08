import mongoose, { Model, ObjectId, Schema, models } from "mongoose";
import { Category, categories } from "types/enums/audio-category.enum";

// ? Interfaces
export interface AudioDocument<T = ObjectId> {
  _id: ObjectId;
  title: string;
  about: string;
  owner: T;
  file: {
    url: string;
    publicId: string;
  };
  poster?: {
    url: string;
    publicId: string;
  };
  likes: ObjectId[];
  //! Duration values that gets returned from cloudinary is in seconds
  duration: Number;
  category: Category;
  createdAt: Date;
}

// ? Schema
const audioSchema = new Schema<AudioDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    file: {
      type: Object,
      url: String,
      publicId: String,
      required: true,
    },
    poster: {
      type: Object,
      url: String,
      publicId: String,
    },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    duration: Number,
    category: {
      type: String,
      enum: categories,
      default: "Others",
    },
  },
  { timestamps: true },
);

// ? Model

const AudioModel = models.Audio || mongoose.model("Audio", audioSchema);

export default AudioModel as Model<AudioDocument>;
