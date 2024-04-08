import mongoose, { Model, ObjectId, Schema, models } from "mongoose";

export interface FavoriteDocument {
  owner: ObjectId;
  items: ObjectId[];
}

const favoriteSchema = new Schema<FavoriteDocument>({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  items: [{ type: Schema.Types.ObjectId, ref: "Audio" }],
});

const FavoriteModel = models.Favorite || mongoose.model("Favorite", favoriteSchema);

export default FavoriteModel as Model<FavoriteDocument>;
