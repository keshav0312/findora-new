import mongoose, { Schema, Document, Model } from "mongoose";
import { itemFieldDefs } from "./itemFields.js";

export interface IFoundItem extends Document {
  title: string;
  category: string;
  description: string;
  color: string;
  brand: string;
  location: string;
  city: string;
  contactPhone: string;
  coordinates: { lat: number | null; lng: number | null };
  date: Date;
  reward: number;
  photos: string[];
  verificationQuestions: { question: string; answer: string }[];
  status: "open" | "matched" | "closed";
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FoundItemSchema = new Schema<IFoundItem>(itemFieldDefs as any, {
  timestamps: true,
});

FoundItemSchema.index({ category: 1, city: 1, status: 1 });
FoundItemSchema.index({ title: "text", description: "text", brand: "text" });

const FoundItem: Model<IFoundItem> =
  mongoose.models.FoundItem ||
  mongoose.model<IFoundItem>("FoundItem", FoundItemSchema);

export default FoundItem;
