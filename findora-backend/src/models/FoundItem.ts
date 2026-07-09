import mongoose, { Schema, Document, Model } from "mongoose";
import { itemFieldDefs } from "./itemFields.js";

export interface ILostItem extends Document {
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

const LostItemSchema = new Schema<ILostItem>(itemFieldDefs as any, {
  timestamps: true,
});

LostItemSchema.index({ category: 1, city: 1, status: 1 });
LostItemSchema.index({ title: "text", description: "text", brand: "text" });

const LostItem: Model<ILostItem> =
  mongoose.models.LostItem ||
  mongoose.model<ILostItem>("LostItem", LostItemSchema);

export default LostItem;