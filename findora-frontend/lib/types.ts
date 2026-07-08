export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "user" | "admin" | "police";
  city?: string;
  phone?: string;
  isVerified: boolean;
  trustPoints: number;
  badge: "none" | "bronze" | "silver" | "gold";
  createdAt: string;
}

export interface ItemOwner {
  _id: string;
  name: string;
  avatar: string | null;
  trustPoints: number;
  badge: string;
  lastSeen?: string;
}

export interface Report {
  _id: string;
  title: string;
  category: string;
  description: string;
  color: string;
  brand: string;
  location: string;
  city: string;
  coordinates: { lat: number | null; lng: number | null };
  date: string;
  reward: number;
  photos: string[];
  verificationQuestions: { question: string; answer?: string }[];
  status: "open" | "matched" | "closed";
  owner: ItemOwner | string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchBreakdown {
  category: number;
  location: number;
  description: number;
  date: number;
  image: number;
}

export interface MatchRecord {
  _id: string;
  lostItem: Report;
  foundItem: Report;
  lostOwner: ItemOwner;
  foundOwner: ItemOwner;
  score: number;
  breakdown: MatchBreakdown;
  status: "suggested" | "confirmed" | "rejected" | "returned";
  aiExplanation?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  _id: string;
  type: "match" | "message" | "claim" | "returned" | "nearby" | "system";
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: string;
  recipient: string;
  matchId?: string;
  text: string;
  attachment?: { kind: "image" | "audio"; url: string; durationSeconds?: number } | null;
  read: boolean;
  createdAt: string;
}

export const CATEGORIES = [
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
];
