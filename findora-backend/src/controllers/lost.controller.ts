import LostItem from "../models/LostItem.js";
import FoundItem from "../models/FoundItem.js";
import { buildItemController } from "./itemFactory.js";

export const {
  create: createLostItem,
  list: listLostItems,
  mine: myLostItems,
  getOne: getLostItem,
  update: updateLostItem,
  remove: deleteLostItem,
  markResolved: resolveLostItem,
} = buildItemController({ model: LostItem, oppositeModel: FoundItem, kind: "lost" });
