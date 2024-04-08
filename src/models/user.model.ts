import { compare, hash } from "bcrypt";
import mongoose, { Model, ObjectId, Schema, models } from "mongoose";

// ? Interfaces
export interface UserDocument {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  avatar?: { url: string; publicId: string };
  tokens: string[];
  favorites: ObjectId[];
  followers: ObjectId[];
  followings: ObjectId[];
}

interface Methods {
  comparePassword(password: string): Promise<boolean>;
}

// ? Schema
const userSchema = new Schema<UserDocument, {}, Methods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: Object,
      url: String,
      publicId: String,
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Audio",
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followings: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tokens: [String],
  },
  { timestamps: true },
);

// ? Hooks
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hash(this.password, 10);
  }

  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;

  if (update!.password) {
    (this as any)._update.password = await hash((this as any)._update.password, 10);
  }

  next();
});

// ? Methods
userSchema.methods.comparePassword = async function (password: string) {
  const result = await compare(password, this.password);
  return result;
};

// ? Model
const UserModel = models.User || mongoose.model("User", userSchema);

export default UserModel as Model<UserDocument, {}, Methods>;
