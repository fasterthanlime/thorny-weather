
import * as ex from "excalibur";

import constants from "./constants";
import {MapSpec} from "./parse-map";

const mapping = {
  "b": {x:  1, y: 1}, // background tile
  "0": {x:  1, y: 3},
  "1": {x:  2, y: 3},
  "2": {x:  3, y: 3},
  "3": {x:  4, y: 3},
  "4": {x:  5, y: 3},
  "5": {x:  6, y: 3},
  "6": {x:  7, y: 3},
};

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

      const tileSpec = mapping[c];
      if (tileSpec) {
        cell.pushSprite(new ex.TileSprite("main", tileIndex(tileSpec)));
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
