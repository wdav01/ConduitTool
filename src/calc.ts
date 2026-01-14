import type { CableItem, CableAreaEntry } from "./parseTables";
import type { ConduitAreaMap } from "./inferConduitArea";
import { interpolateConduitArea } from "./inferConduitArea";

export type CalculationContext = {
  knownSizes: number[];
  conduitAreas: ConduitAreaMap;
  cableAreaMap: Map<string, CableAreaEntry>;
};

export type CheckResult = {
  mode: "check";
  input: {
    conduit: number;
    items: CableItem[];
  };
  totalCount: number;
  totalArea: number;
  SF_install: number;
  A_conduit_used: number;
  allowableArea: number;
  utilisationPercent: number;
  pass: boolean;
};

export type RecommendAttempt = {
  size: number;
  utilisationPercent: number;
  pass: boolean;
};

export type RecommendResult = {
  mode: "recommend";
  input: {
    items: CableItem[];
  };
  totalCount: number;
  totalArea: number;
  SF_install: number;
  A_conduit_used: number;
  allowableArea: number;
  utilisationPercent: number;
  pass: boolean;
  selectedConduit: number | null;
  attempts: RecommendAttempt[];
  message?: string;
};

const areaKey = (cableType: string, cableSize: number) =>
  `${cableType}|||${cableSize}`;

export const getSpaceFactorForInstall = (totalCount: number): number => {
  if (totalCount === 1) {
    return 0.5;
  }
  if (totalCount === 2) {
    return 0.33;
  }
  if (totalCount >= 3) {
    return 0.4;
  }
  throw new Error("Total cable count must be at least 1");
};

const validateQuantity = (item: CableItem) => {
  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    throw new Error(
      `Invalid quantity for cableType='${item.cableType}', cableSize=${item.cableSize}: must be integer >= 1.`
    );
  }
};

export const computeTotals = (
  items: CableItem[],
  cableAreaMap: Map<string, CableAreaEntry>
) => {
  let totalCount = 0;
  let totalArea = 0;

  items.forEach((item) => {
    validateQuantity(item);
    const entry = cableAreaMap.get(areaKey(item.cableType, item.cableSize));
    if (!entry) {
      throw new Error(
        `Missing diameter/area for cableType='${item.cableType}', cableSize=${item.cableSize}; add it to CableDiameterArea.`
      );
    }
    totalCount += item.quantity;
    totalArea += item.quantity * entry.area;
  });

  return { totalCount, totalArea };
};

const roundPercent = (value: number): number =>
  Math.round(value * 10) / 10;

export const checkConduit = (
  items: CableItem[],
  conduitSize: number,
  context: CalculationContext
): CheckResult => {
  const { totalCount, totalArea } = computeTotals(items, context.cableAreaMap);
  const SF_install = getSpaceFactorForInstall(totalCount);
  const A_conduit_used = interpolateConduitArea(
    conduitSize,
    context.knownSizes,
    context.conduitAreas
  );
  const allowableArea = A_conduit_used * SF_install;
  const utilisation = totalArea / allowableArea;
  const utilisationPercent = roundPercent(utilisation * 100);
  const pass = totalArea <= allowableArea;

  return {
    mode: "check",
    input: { conduit: conduitSize, items },
    totalCount,
    totalArea,
    SF_install,
    A_conduit_used,
    allowableArea,
    utilisationPercent,
    pass
  };
};

export const recommendConduit = (
  items: CableItem[],
  context: CalculationContext
): RecommendResult => {
  const { totalCount, totalArea } = computeTotals(items, context.cableAreaMap);
  const SF_install = getSpaceFactorForInstall(totalCount);
  const attempts: RecommendAttempt[] = [];

  let selectedConduit: number | null = null;
  let finalAConduit = 0;
  let finalAllowable = 0;
  let finalUtilisationPercent = 0;
  let finalPass = false;

  for (const size of context.knownSizes) {
    const A_conduit_used = interpolateConduitArea(
      size,
      context.knownSizes,
      context.conduitAreas
    );
    const allowableArea = A_conduit_used * SF_install;
    const utilisation = totalArea / allowableArea;
    const utilisationPercent = roundPercent(utilisation * 100);
    const pass = totalArea <= allowableArea;
    attempts.push({ size, utilisationPercent, pass });

    if (selectedConduit === null && pass) {
      selectedConduit = size;
      finalAConduit = A_conduit_used;
      finalAllowable = allowableArea;
      finalUtilisationPercent = utilisationPercent;
      finalPass = true;
      break;
    }

    if (size === context.knownSizes[context.knownSizes.length - 1]) {
      finalAConduit = A_conduit_used;
      finalAllowable = allowableArea;
      finalUtilisationPercent = utilisationPercent;
      finalPass = pass;
    }
  }

  const message =
    selectedConduit === null
      ? "No conduit size in table passes"
      : undefined;

  return {
    mode: "recommend",
    input: { items },
    totalCount,
    totalArea,
    SF_install,
    A_conduit_used: finalAConduit,
    allowableArea: finalAllowable,
    utilisationPercent: finalUtilisationPercent,
    pass: finalPass,
    selectedConduit,
    attempts,
    message
  };
};
