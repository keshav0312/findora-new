// Seeds the database with demo data so the dashboards look like the
// product mockup out of the box. Run with: npm run seed
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import User from "./models/User.js";
import LostItem from "./models/LostItem.js";
import FoundItem from "./models/FoundItem.js";
import Match from "./models/Match.js";
import Notification from "./models/Notification.js";
import { computeMatch, MATCH_THRESHOLD } from "./utils/matching.js";
import mongoose from "mongoose";

async function seed() {
  await connectDB();
  console.log("Clearing existing demo data...");
  await Promise.all([
    User.deleteMany({}),
    LostItem.deleteMany({}),
    FoundItem.deleteMany({}),
    Match.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log("Creating users...");
  const arjun = await User.create({
    name: "Arjun Sharma",
    email: "arjun@example.com",
    password: "password123",
    city: "Bhopal",
    role: "user",
    isVerified: true,
    trustPoints: 40,
    badge: "silver",
  });

  const priya = await User.create({
    name: "Priya Sharma",
    email: "priya@example.com",
    password: "password123",
    city: "Bhopal",
    role: "user",
    isVerified: true,
    trustPoints: 25,
    badge: "bronze",
  });

  const ramesh = await User.create({
    name: "Ramesh Yadav",
    email: "ramesh@example.com",
    password: "password123",
    city: "Bhopal",
    role: "user",
    isVerified: true,
    trustPoints: 15,
    badge: "bronze",
  });

  await User.create({
    name: "Admin",
    email: "admin@findora.app",
    password: "admin12345",
    role: "admin",
    isVerified: true,
  });

  await User.create({
    name: "Bhopal Police Desk",
    email: "police@findora.app",
    password: "police12345",
    role: "police",
    isVerified: true,
  });

  console.log("Creating lost & found reports...");
  const lostWallet = await LostItem.create({
    title: "Black Wallet",
    category: "Wallet",
    description: "Black leather wallet, has a PAN card and around ₹1500 cash",
    color: "Black",
    brand: "Wildcraft",
    location: "DB Mall, Food Court",
    city: "Bhopal",
    date: new Date(Date.now() - 2 * 86400000),
    reward: 1000,
    photos: [],
    verificationQuestions: [
      { question: "What brand is the wallet?", answer: "Wildcraft" },
      { question: "Roughly how much cash was inside?", answer: "1500" },
    ],
    owner: arjun._id,
  });

  const foundWallet = await FoundItem.create({
    title: "Black Wallet",
    category: "Wallet",
    description: "Found a black leather wallet near the food court, has a PAN card and some cash",
    color: "Black",
    brand: "Wildcraft",
    location: "DB Mall, near parking",
    city: "Bhopal",
    date: new Date(Date.now() - 1 * 86400000),
    photos: [],
    owner: priya._id,
  });

  const foundPhone = await FoundItem.create({
    title: "iPhone 13",
    category: "Mobile",
    description: "Found near MP Nagar bus stand, screen has a small crack",
    color: "Blue",
    brand: "Apple",
    location: "MP Nagar",
    city: "Bhopal",
    date: new Date(Date.now() - 3 * 86400000),
    photos: [],
    owner: ramesh._id,
  });

  const lostBackpack = await LostItem.create({
    title: "Red Backpack",
    category: "Bag",
    description: "Red backpack with a laptop and charger inside, lost at the bus stand",
    color: "Red",
    brand: "Wildcraft",
    location: "Bus Stand",
    city: "Bhopal",
    date: new Date(Date.now() - 4 * 86400000),
    photos: [],
    owner: priya._id,
    status: "closed",
  });

  await LostItem.create({
    title: "Car Keys",
    category: "Keys",
    description: "Toyota key fob with a small blue keychain",
    color: "Silver",
    brand: "Toyota",
    location: "Kolar Road",
    city: "Bhopal",
    date: new Date(Date.now() - 30 * 86400000),
    photos: [],
    owner: arjun._id,
  });

  console.log("Computing matches...");
  const lostItems = await LostItem.find({ status: "open" });
  const foundItems = await FoundItem.find({ status: "open" });

  for (const lost of lostItems) {
    for (const found of foundItems) {
      const { score, breakdown } = computeMatch(lost.toObject(), found.toObject());
      if (score >= MATCH_THRESHOLD) {
        await Match.create({
          lostItem: lost._id,
          foundItem: found._id,
          lostOwner: lost.owner,
          foundOwner: found.owner,
          score,
          breakdown,
        });
      }
    }
  }

  console.log("Creating notifications...");
  await Notification.create([
    {
      user: arjun._id,
      type: "match",
      title: "Possible match found",
      body: `A likely match was found for "${lostWallet.title}"`,
      link: "/matches",
    },
    {
      user: priya._id,
      type: "claim",
      title: "Claim request",
      body: "Arjun Sharma wants to verify your found wallet report",
      link: "/matches",
    },
  ]);

  console.log("✅ Seed complete");
  console.log("Demo logins:");
  console.log("  user:   arjun@example.com   / password123");
  console.log("  user:   priya@example.com   / password123");
  console.log("  admin:  admin@findora.app   / admin12345");
  console.log("  police: police@findora.app  / police12345");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
