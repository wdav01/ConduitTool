export type CableItem = {
  cableType: string;
  cableSize: number;
  quantity: number;
};

export type TableRow = {
  cableType: string;
  cableSize: number;
  values: number[];
};

export type CapacityTable = {
  sizes: number[];
  rows: TableRow[];
};

export type CableAreaEntry = {
  cableType: string;
  cableSize: number;
  diameter: number;
  area: number;
};

const tableSingleCoreCapacityCsv = `CableType,CableSize,20,25,32,40,50,63,80,100,125,150
PVC/PVC V90,1,5,9,16,26,43,71,150,247,374,488
PVC/PVC V90,1.5,4,7,13,21,36,59,124,205,310,405
PVC/PVC V90,2.5,3,5,10,16,27,44,92,153,232,303
PVC/PVC V90,4,1,3,7,11,19,31,64,107,163,212
PVC/PVC V90,6,1,3,6,9,16,26,55,92,135,176
PVC/PVC V90,10,1,1,4,6,11,18,38,63,95,121
PVC/PVC V90,16,1,1,3,5,8,13,28,46,70,92
XLPE/PVC,25,0,1,1,3,5,9,19,31,48,62
XLPE/PVC,35,0,1,1,2,4,7,15,26,39,52
XLPE/PVC,50,0,1,1,1,3,6,12,21,31,41
XLPE/PVC,70,0,0,1,1,2,4,9,16,24,31
XLPE/PVC,95,0,0,1,1,1,3,7,12,18,24
XLPE/PVC,120,0,0,0,1,1,2,6,10,15,20
XLPE/PVC,150,0,0,0,1,1,2,5,8,12,16
XLPE/PVC,185,0,0,0,1,1,1,4,6,10,13
XLPE/PVC,240,0,0,0,0,1,1,3,5,8,10
XLPE/PVC,300,0,0,0,0,1,1,2,4,6,8
XLPE/PVC,400,0,0,0,0,0,1,1,3,5,7
XLPE/PVC,500,0,0,0,0,0,0,1,3,4,6
XLPE/PVC,630,0,0,0,0,0,0,1,2,3,4`;

const tableFourCoreCapacityCsv = `CableType,CableSize,20,25,32,40,50,63,80,100,125,150
4C PVC/PVC V90,1.5,0,1,1,3,5,9,18,31,47,61
4C PVC/PVC V90,2.5,0,1,1,2,4,6,14,23,35,46
4C PVC/PVC V90,4,0,0,1,1,3,5,10,18,27,35
4C PVC/PVC V90,6,0,0,1,1,2,4,9,15,23,31
4C PVC/PVC V75,10,0,0,0,1,1,2,6,10,15,20
4C PVC/PVC V75,16,0,0,0,1,1,1,4,8,12,15
4C PVC/PVC V75,25,0,0,0,0,1,1,3,5,8,11
4C PVC/PVC V75,35,0,0,0,0,1,1,2,4,7,9
4C PVC/PVC V75,50,0,0,0,0,0,1,1,3,5,6
4C PVC/PVC V75,70,0,0,0,0,0,0,1,2,4,5
4C PVC/PVC V75,95,0,0,0,0,0,0,1,1,3,4
4C XLPE/PVC,16,0,0,0,1,1,3,6,10,15,20
4C XLPE/PVC,25,0,0,0,0,1,1,3,6,9,12
4C XLPE/PVC,35,0,0,0,0,1,1,3,5,7,10
4C XLPE/PVC,50,0,0,0,0,0,1,2,3,6,7
4C XLPE/PVC,70,0,0,0,0,0,1,2,2,4,5
4C XLPE/PVC,95,0,0,0,0,0,0,1,1,3,4
4C XLPE/PVC,120,0,0,0,0,0,0,1,1,2,3`;

const cableDiameterAreaCsv = `CableType,CableSize,Diameter,Area
PVC/PVC V90,1,4.1,13.20254313
PVC/PVC V90,1.5,4.5,15.90431281
PVC/PVC V90,2.5,5.2,21.23716634
PVC/PVC V90,4,6.2,30.1907054
PVC/PVC V90,6,6.8,36.31681108
PVC/PVC V90,10,8.2,52.81017251
PVC/PVC V90,16,9.4,69.39778172
XLPE/PVC,25,11.2,98.52034562
XLPE/PVC,35,12.4,120.7628216
XLPE/PVC,50,13.9,151.7467792
XLPE/PVC,70,15.8,196.0667975
XLPE/PVC,95,17.9,251.6494255
XLPE/PVC,120,19.6,301.7185585
XLPE/PVC,150,21.9,376.6848131
XLPE/PVC,185,24.1,456.1671073
XLPE/PVC,240,27.1,576.8042652
XLPE/PVC,300,30,706.8583471
XLPE/PVC,400,33.5,881.4130889
XLPE/PVC,500,35.2,973.1397404
XLPE/PVC,630,39.7,1237.858191`;

const splitCsvLines = (csv: string): string[] =>
  csv
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const parseCapacityTable = (csv: string): CapacityTable => {
  const lines = splitCsvLines(csv);
  const [header, ...rows] = lines;
  const headers = header.split(",").map((value) => value.trim());
  const sizes = headers.slice(2).map((value) => Number(value));
  const parsedRows: TableRow[] = rows.map((row) => {
    const parts = row.split(",").map((value) => value.trim());
    const cableType = parts[0];
    const cableSize = Number(parts[1]);
    const values = parts.slice(2).map((value) => Number(value));
    return { cableType, cableSize, values };
  });
  return { sizes, rows: parsedRows };
};

const parseCableAreas = (csv: string): CableAreaEntry[] => {
  const lines = splitCsvLines(csv);
  const [, ...rows] = lines;
  return rows.map((row) => {
    const parts = row.split(",").map((value) => value.trim());
    return {
      cableType: parts[0],
      cableSize: Number(parts[1]),
      diameter: Number(parts[2]),
      area: Number(parts[3])
    };
  });
};

export const buildCableAreaMap = (entries: CableAreaEntry[]): Map<string, CableAreaEntry> => {
  const map = new Map<string, CableAreaEntry>();
  entries.forEach((entry) => {
    map.set(`${entry.cableType}|||${entry.cableSize}`, entry);
  });
  return map;
};

export const parseTables = () => {
  const tableSingle = parseCapacityTable(tableSingleCoreCapacityCsv);
  const tableFour = parseCapacityTable(tableFourCoreCapacityCsv);
  const cableAreas = parseCableAreas(cableDiameterAreaCsv);
  const cableAreaMap = buildCableAreaMap(cableAreas);

  return {
    tableSingle,
    tableFour,
    cableAreas,
    cableAreaMap
  };
};
