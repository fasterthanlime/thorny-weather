
import constants from "./constants";
import {IColRow} from "./types";
import {mapping} from "./update-map";
import {filePath} from "./resources";

import {promisifyAll} from "bluebird";
import * as fsOrig from "fs";
const fs = promisifyAll(fsOrig);

const defaultTile = "0";

// tslint:disable
export interface MapSpec {
  [key: number]: string[];
  path?: string;
  name?: string;
};
// tslint:enable

const reverseMapping: {
  [key: number]: string;
} = {};

const sheetColumns = 13;
const coordsToIndex = ({x, y}): number => {
  return x + y * sheetColumns;
};

for (const key of Object.keys(mapping)) {
  const coords = mapping[key];
  let cleanedKey = key.substr(0, 1);
  if (cleanedKey === "e") {
    cleanedKey = "l";
  }
  reverseMapping[coordsToIndex(coords)] = cleanedKey;
}

export async function parseJsonMap(mapName: string): Promise<MapSpec> {
  const mapPath = filePath(`levels/${mapName}.json`);
  const contents = await fs.readFileAsync(mapPath, {encoding: "utf8"});
  const fullData = JSON.parse(contents);
  const firstgid = fullData.tilesets[0].firstgid;
  const layer = fullData.layers[0];

  const res: MapSpec = [];
  res.name = layer.name;
  res.path = mapName;

  const data = layer.data;

  let index = 0;
  for (let row = 0; row < constants.mapRows; row++) {
    res[row] = Array(constants.mapCols).fill(defaultTile);

    for (let column = 0; column < constants.mapCols; column++) {
      const tileIndex = data[index] - firstgid;
      res[row][column] = reverseMapping[tileIndex] || "0";
      index++;
    }
  }

  return res;
}

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

export function inMap({col, row}: IColRow): boolean {
  if (col < 0) {
    return false;
  }
  if (col >= constants.mapCols) {
    return false;
  }
  if (row < 0) {
    return false;
  }
  if (row >= constants.mapRows) {
    return false;
  }
  return true;
}
