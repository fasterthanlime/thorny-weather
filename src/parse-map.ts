
import constants from "./constants";

const defaultTile = "0";
export type MapSpec = string[][];

export function parseMap(map: string): MapSpec {
  const mapLines = map.split("\n").filter((x) => x.trim().length > 0);
  const res: string[][] = [];
  for (let row = 0; row < constants.mapRows; row++) {
    res.push(Array(constants.mapCols).fill(defaultTile));

    const line = mapLines[row] || "";
    for (let column = 0; column < line.length; column++) {
      if (column < line.length) {
        res[row][column] = line.charAt(column);
      }
    }
  }

  return res;
}
