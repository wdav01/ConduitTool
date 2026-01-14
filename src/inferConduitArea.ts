import type { CapacityTable, CableAreaEntry } from "./parseTables";

export type ConduitAreaMap = Map<number, number>;

const spaceFactorForCount = (count: number): number => {
  if (count === 1) {
    return 0.5;
  }
  if (count === 2) {
    return 0.33;
  }
  return 0.4;
};

const areaKey = (cableType: string, cableSize: number) =>
  `${cableType}|||${cableSize}`;

export const inferConduitAreas = (
  tables: CapacityTable[],
  cableAreaMap: Map<string, CableAreaEntry>
): ConduitAreaMap => {
  if (tables.length === 0) {
    return new Map();
  }

  const sizes = tables[0].sizes;
  const areas = new Map<number, number>();

  sizes.forEach((size, index) => {
    const inferredValues: number[] = [];
    tables.forEach((table) => {
      table.rows.forEach((row) => {
        const nMax = row.values[index];
        if (nMax <= 0) {
          return;
        }
        const areaEntry = cableAreaMap.get(areaKey(row.cableType, row.cableSize));
        if (!areaEntry) {
          return;
        }
        const sfTable = spaceFactorForCount(nMax);
        const inferred = (nMax * areaEntry.area) / sfTable;
        inferredValues.push(inferred);
      });
    });

    if (inferredValues.length === 0) {
      throw new Error(`Cannot infer conduit area for size ${size}`);
    }

    const minValue = Math.min(...inferredValues);
    areas.set(size, minValue);
  });

  return areas;
};

export const interpolateConduitArea = (
  size: number,
  knownSizes: number[],
  areaMap: ConduitAreaMap
): number => {
  const exact = areaMap.get(size);
  if (exact !== undefined) {
    return exact;
  }

  const sorted = [...knownSizes].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (size < min || size > max) {
    throw new Error("Conduit size out of supported range");
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (size > lo && size < hi) {
      const areaLo = areaMap.get(lo);
      const areaHi = areaMap.get(hi);
      if (areaLo === undefined || areaHi === undefined) {
        throw new Error(`Cannot infer conduit area for size ${size}`);
      }
      return areaLo + ((size - lo) * (areaHi - areaLo)) / (hi - lo);
    }
  }

  throw new Error(`Cannot infer conduit area for size ${size}`);
};

export const spaceFactorForTableCount = spaceFactorForCount;
