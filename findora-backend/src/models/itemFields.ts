import { Schema } from "mongoose";

// Shared field definition used by both LostItem and FoundItem so the two
// collections stay structurally identical (this is what the matching
// algorithm in utils/matching.ts relies on).
export const itemFieldDefs = {
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: [
      "Wallet",
      "Mobile",
      "Laptop",
      "Keys",
      "Passport",
      "Aadhaar",
      "PAN Card",
      "Bag",
      "Watch",
      "Jewelry",
      "Pet",
      "Document",
      "Earbuds",
      "Bicycle",
      "Helmet",
      "Water Bottle",
      "Charger",
      "USB Drive",
      "Other",
    ],
  },
  description: { type: String, default: "" },
  color: { type: String, default: "" },
  brand: { type: String, default: "" },
  location: { type: String, required: true, trim: true },
  city: { type: String, default: "", trim: true },
  contactPhone: { type: String, default: "", trim: true },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  date: { type: Date, required: true },
  reward: { type: Number, default: 0 },
  photos: [{ type: String }],
  verificationQuestions: [
    {
      question: { type: String },
      answer: { type: String }, // only ever readable by the report owner
    },
  ],
  status: {
    type: String,
    enum: ["open", "matched", "closed"],
    default: "open",
  },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
};