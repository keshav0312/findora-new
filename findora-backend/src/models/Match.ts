import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMatch extends Document {
  lostItem: mongoose.Types.ObjectId;
  foundItem: mongoose.Types.ObjectId;
  lostOwner: mongoose.Types.ObjectId;
  foundOwner: mongoose.Types.ObjectId;
  score: number;
  breakdown: {
    category: number;
    location: number;
    description: number;
    date: number;
    image: number;
  };
  status: "suggested" | "confirmed" | "rejected" | "returned";
  aiExplanation?: string;
  createdAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    lostItem: { type: Schema.Types.ObjectId, ref: "LostItem", required: true },
    foundItem: { type: Schema.Types.ObjectId, ref: "FoundItem", required: true },
    lostOwner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    foundOwner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true },
    breakdown: {
      category: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      description: { type: Number, default: 0 },
      date: { type: Number, default: 0 },
      image: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["suggested", "confirmed", "rejected", "returned"],
      default: "suggested",
    },
    aiExplanation: { type: String, default: "" },
  },
  { timestamps: true }
);

MatchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });

const Match: Model<IMatch> =
  mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);

export default Match;
