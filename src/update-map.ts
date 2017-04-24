
import * as ex from "excalibur";

import constants from "./constants";
import {MapSpec, inMap} from "./parse-map";
import {IColRow} from "./types";

const mapping = {
  "b": {x:  1, y: 1}, // background tile

  "0": {x:  1, y: 3},
  "1": {x:  2, y: 3},
  "2": {x:  3, y: 3},
  "3": {x:  4, y: 3},
  "4": {x:  5, y: 3},
  "5": {x:  6, y: 3},

  "s": {x:  7, y: 3}, // solid

  "l": {x:  7, y: 5}, // lock

  "s-tl":  {x:  6, y: 0}, // solid
  "s-t":   {x:  7, y: 0}, // solid
  "s-tr":  {x:  8, y: 0}, // solid
  "s-l":   {x:  6, y: 1}, // solid
  "s-":    {x:  7, y: 1}, // solid
  "s-r":   {x:  8, y: 1}, // solid
  "s-bl":  {x:  6, y: 2}, // solid
  "s-b":   {x:  7, y: 2}, // solid
  "s-br":  {x:  8, y: 2}, // solid
};

function offsetToName(cr: IColRow): string {
  let res = "s-";
  if (cr.row > 0) {
    res += "b";
  } else if (cr.row < 0) {
    res += "t";
  }
  if (cr.col > 0) {
    res += "r";
  } else if (cr.col < 0) {
    res += "l";
  }
  return res;
}

export function updateMap(tilemap: ex.TileMap, sheet: ex.SpriteSheet, spec: MapSpec) {
  const tileIndex = ({x, y}): number => {
    return x + y * sheet.columns;
  };

  for (let row = 0; row < constants.mapRows; row++) {
    for (let col = 0; col < constants.mapCols; col++) {
      const c = spec[row][col];
      const cell = tilemap.getCell(col, row);
      cell.clearSprites();
      cell.pushSprite(new ex.TileSprite("main", tileIndex(mapping.b)));

      if (c === "s") {
        cell.pushSprite(new ex.TileSprite("main", tileIndex(mapping["s-"])));
        for (const dcol of [-1, 0, 1]) {
          for (const drow of [-1, 0, 1]) {
            if (dcol === 0 && drow === 0) {
              continue;
            }

            const target = {col: col + dcol, row: row + drow};
            if (inMap(target)) {
              if (spec[target.row][target.col] === "s") {
                cell.pushSprite(new ex.TileSprite("main", tileIndex(mapping[offsetToName({col: dcol, row: drow})])));
              }
            }
          }
        }
      } else {
        const tileSpec = mapping[c];
        if (tileSpec) {
          cell.pushSprite(new ex.TileSprite("main", tileIndex(tileSpec)));
        }
      }

      // looks dumb but logic might be more complicated later
      if (c === "5") {
        cell.solid = true;
      } else {
        cell.solid = false;
      }
    }
  }
}
