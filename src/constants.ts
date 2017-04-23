
const cellWidth = 64;
const cellHeight = 64;
const mapCols = 15;
const mapRows = 10;

export default {
  cellWidth,
  cellHeight,

  mapCols,
  mapRows,

  windowWidth: mapCols * cellWidth,
  windowHeight: mapRows * cellHeight,
};
