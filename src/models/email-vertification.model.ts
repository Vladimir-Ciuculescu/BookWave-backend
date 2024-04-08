import mongoose, { Model, ObjectId, Schema, models } from "mongoose";
import { hash, compare } from "bcrypt";

// ? Interfaces
export interface EmailVertificationTokenDocument {
  owner: ObjectId;
  token: string;
  createdAt: Date;
}

interface Methods {
  compareToken(token: string): Promise<boolean>;
}

// ? Schema
const emailVerificationTokenSchema = new Schema<EmailVertificationTokenDocument, {}, Methods>({
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

// ? Hooks
emailVerificationTokenSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    this.token = await hash(this.token, 10);
  }

  next();
});

// ? Methods
emailVerificationTokenSchema.methods.compareToken = async function (token: string) {
  const result = await compare(token, this.token);
  return result;
};

// ? Model
const EmailVerificationTokenModel = models.EmailVerificationToken || mongoose.model("EmailVerificationToken", emailVerificationTokenSchema);

export default EmailVerificationTokenModel as Model<EmailVertificationTokenDocument, {}, Methods>;
