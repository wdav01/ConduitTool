#!/usr/bin/env node
import { parseTables } from "./parseTables";
import { inferConduitAreas } from "./inferConduitArea";
import { checkConduit, recommendConduit } from "./calc";

const KNOWN_SIZES = [20, 25, 32, 40, 50, 63, 80, 100, 125, 150];

const parseItems = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error("Items must be an array");
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to parse items JSON: ${message}`);
  }
};

const getArgValue = (flag: string, args: string[]) => {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return args[index + 1] ?? null;
};

const main = () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || (command !== "recommend" && command !== "check")) {
    throw new Error("Usage: recommend --items '[...]' | check --conduit <size> --items '[...]'");
  }

  const itemsArg = getArgValue("--items", args);
  if (!itemsArg) {
    throw new Error("--items argument is required");
  }

  const items = parseItems(itemsArg);
  const { tableSingle, tableFour, cableAreaMap } = parseTables();
  const conduitAreas = inferConduitAreas([tableSingle, tableFour], cableAreaMap);
  const context = {
    knownSizes: KNOWN_SIZES,
    conduitAreas,
    cableAreaMap
  };

  if (command === "check") {
    const conduitArg = getArgValue("--conduit", args);
    if (!conduitArg) {
      throw new Error("--conduit argument is required for check");
    }
    const conduit = Number(conduitArg);
    if (Number.isNaN(conduit)) {
      throw new Error("Conduit must be a number");
    }
    const result = checkConduit(items, conduit, context);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = recommendConduit(items, context);
  console.log(JSON.stringify(result, null, 2));
};

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
