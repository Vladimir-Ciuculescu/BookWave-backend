import { Model, ObjectId, Schema, models } from "mongoose";
import { Visibility, visibilites } from "types/enums/visibility.enum";
import { model } from "mongoose";

export interface PlayListDocument {
  title: string;
  owner: ObjectId;
  items: ObjectId[];
  visibility: Visibility;
}

const playListSchema = new Schema<PlayListDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Audio",
      },
    ],
    visibility: {
      type: String,
      enum: visibilites,
      default: "public",
    },
  },
  { timestamps: true },
);

const PlayListModel = models.Playlist || model("Playlist", playListSchema);

export default PlayListModel as Model<PlayListDocument>;
