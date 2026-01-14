import { describe, expect, it } from "vitest";
import { parseTables } from "../src/parseTables";
import {
  inferConduitAreas,
  interpolateConduitArea,
  spaceFactorForTableCount
} from "../src/inferConduitArea";
import {
  checkConduit,
  getSpaceFactorForInstall,
  recommendConduit
} from "../src/calc";

const KNOWN_SIZES = [20, 25, 32, 40, 50, 63, 80, 100, 125, 150];

const buildContext = () => {
  const { tableSingle, tableFour, cableAreaMap } = parseTables();
  const conduitAreas = inferConduitAreas([tableSingle, tableFour], cableAreaMap);
  return { knownSizes: KNOWN_SIZES, conduitAreas, cableAreaMap, tables: [tableSingle, tableFour] };
};

describe("space factor rules", () => {
  it("returns 0.5 for 1 cable", () => {
    expect(getSpaceFactorForInstall(1)).toBe(0.5);
  });

  it("returns 0.33 for 2 cables", () => {
    expect(getSpaceFactorForInstall(2)).toBe(0.33);
  });

  it("returns 0.4 for 3+ cables", () => {
    expect(getSpaceFactorForInstall(3)).toBe(0.4);
    expect(getSpaceFactorForInstall(5)).toBe(0.4);
  });
});

describe("conduit area inference", () => {
  it("uses MIN inferred value for a size", () => {
    const context = buildContext();
    const sizeIndex = context.tables[0].sizes.indexOf(20);
    const inferredValues: number[] = [];

    context.tables.forEach((table) => {
      table.rows.forEach((row) => {
        const nMax = row.values[sizeIndex];
        if (nMax <= 0) {
          return;
        }
        const entry = context.cableAreaMap.get(`${row.cableType}|||${row.cableSize}`);
        if (!entry) {
          return;
        }
        const sfTable = spaceFactorForTableCount(nMax);
        inferredValues.push((nMax * entry.area) / sfTable);
      });
    });

    const expectedMin = Math.min(...inferredValues);
    const actual = context.conduitAreas.get(20);
    expect(actual).toBeDefined();
    expect(actual).toBeCloseTo(expectedMin, 6);
  });
});

describe("recommendation", () => {
  it("chooses the first passing conduit", () => {
    const context = buildContext();
    const items = [{ cableType: "PVC/PVC V90", cableSize: 2.5, quantity: 6 }];
    const result = recommendConduit(items, context);
    const firstPass = result.attempts.find((attempt) => attempt.pass);
    expect(firstPass).toBeDefined();
    expect(result.selectedConduit).toBe(firstPass?.size ?? null);
  });
});

describe("interpolation", () => {
  it("interpolates conduit area between sizes", () => {
    const context = buildContext();
    const area32 = context.conduitAreas.get(32);
    const area40 = context.conduitAreas.get(40);
    expect(area32).toBeDefined();
    expect(area40).toBeDefined();
    const expected = area32! + ((36 - 32) * (area40! - area32!)) / (40 - 32);
    const actual = interpolateConduitArea(36, context.knownSizes, context.conduitAreas);
    expect(actual).toBeCloseTo(expected, 6);
  });
});

describe("error handling", () => {
  it("errors on missing cable area data", () => {
    const context = buildContext();
    const items = [{ cableType: "4C PVC/PVC V90", cableSize: 1.5, quantity: 1 }];
    expect(() => checkConduit(items, 32, context)).toThrow(
      "Missing diameter/area for cableType='4C PVC/PVC V90', cableSize=1.5; add it to CableDiameterArea."
    );
  });

  it("rejects invalid quantities", () => {
    const context = buildContext();
    const items = [{ cableType: "PVC/PVC V90", cableSize: 1.5, quantity: 0 }];
    expect(() => checkConduit(items, 32, context)).toThrow(
      "Invalid quantity for cableType='PVC/PVC V90', cableSize=1.5: must be integer >= 1."
    );
  });
});
