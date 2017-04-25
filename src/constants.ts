
const cellWidth = 64;
const cellHeight = 64;
const mapCols = 15;
const mapRows = 10;

export default {
  startMap: 0,

  cellWidth,
  cellHeight,

  mapCols,
  mapRows,

  windowWidth: mapCols * cellWidth,
  windowHeight: mapRows * cellHeight + 40,
};

export const jsonMaps = [
  "open-gate",
  "growing-gate",
  "gate",
  "sprout",
  "choice",
  "choice2",
  "backforth",
  "advanced1",
  "advanced2",
  "advanced3",
  "advanced4",
  "advanced5",
  "advanced6",
  "win",
  "credits1",
  "credits2",
];
