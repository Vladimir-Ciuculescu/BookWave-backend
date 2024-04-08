import mongoose, { Model, ObjectId, Schema, models } from "mongoose";
import { compare } from "bcrypt";

// ? Interfaces
export interface PasswordResetTokenDocument {
  owner: ObjectId;
  token: string;
  createdAt: Date;
}

interface Methods {
  compareToken(token: string): Promise<boolean>;
}

// ? Schema
const passwordResetTokenSchema = new Schema<PasswordResetTokenDocument, {}, Methods>({
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 3600,
    default: Date.now(),
    required: true,
  },
});

// ? Methods

passwordResetTokenSchema.methods.compareToken = async function (token: string) {
  const result = await compare(token, this.token);
  return result;
};

// ? Model
const PasswordResetTokenModel = models.PasswordResetToken || mongoose.model("PasswordResetToken", passwordResetTokenSchema);

export default PasswordResetTokenModel as Model<PasswordResetTokenDocument, {}, Methods>;
