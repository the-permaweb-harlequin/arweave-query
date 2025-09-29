import { Level } from "level";
import { LevelCache } from "./cache/level.js";

export const defaultLevelCache = new LevelCache(new Level("./cache"), {
  location: "./cache",
});
