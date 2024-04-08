import { Model, ObjectId, Schema, models } from "mongoose";
import { Visibility, visibilites } from "types/enums/visibility.enum";
import { model } from "mongoose";

export interface AutoPlayListDocument {
  title: string;
  items: ObjectId[];
  visibility: Visibility;
}

const autoPlayListSchema = new Schema<AutoPlayListDocument>(
  {
    title: {
      type: String,
      required: true,
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

const AutoPlayListModel = models.AutoPlaylist || model("AutoPlaylist", autoPlayListSchema);

export default AutoPlayListModel as Model<AutoPlayListDocument>;
