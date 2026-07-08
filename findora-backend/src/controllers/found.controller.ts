import LostItem from "../models/LostItem.js";
import FoundItem from "../models/FoundItem.js";
import { buildItemController } from "./itemFactory.js";

export const {
  create: createFoundItem,
  list: listFoundItems,
  mine: myFoundItems,
  getOne: getFoundItem,
  update: updateFoundItem,
  remove: deleteFoundItem,
  markResolved: resolveFoundItem,
} = buildItemController({ model: FoundItem, oppositeModel: LostItem, kind: "found" });
