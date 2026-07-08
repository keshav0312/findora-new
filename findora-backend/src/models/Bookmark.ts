import { Schema, model, Document, Types } from "mongoose";

export interface IBookmark extends Document {
  user: Types.ObjectId;
  itemType: "lost" | "found";
  item: Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemType: { type: String, enum: ["lost", "found"], required: true },
    item: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

// A user can only bookmark a given item once.
BookmarkSchema.index({ user: 1, itemType: 1, item: 1 }, { unique: true });

export default model<IBookmark>("Bookmark", BookmarkSchema);
