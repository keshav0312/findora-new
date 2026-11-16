import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHandover extends Document {
  match: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  confirmedBy: mongoose.Types.ObjectId[];
  completedAt: Date | null;
}

const HandoverSchema = new Schema<IHandover>(
  {
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    confirmedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

HandoverSchema.index({ match: 1 }, { unique: true });

const Handover: Model<IHandover> =
  mongoose.models.Handover || mongoose.model<IHandover>("Handover", HandoverSchema);

export default Handover;
