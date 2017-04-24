
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
