
import * as ex from "excalibur";

import constants from "./constants";
import {MapSpec} from "./parse-map";

// from sokoban_tilesheet
const mapping = {
  "0": {x: 10, y: 6}, // grass tile
  "1": {x: 12, y: 6}, // dirt tile
  "2": {x: 11, y: 6}, // rocks tile
  "3": {x:  8, y: 6}, // concrete tile
  "4": {x:  7, y: 6}, // bricks tile
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
      cell.pushSprite(new ex.TileSprite("main", tileIndex(mapping["2"])));

      const tileSpec = mapping[c];
      if (tileSpec) {
        cell.pushSprite(new ex.TileSprite("main", tileIndex(tileSpec)));
      }

      // looks dumb but logic might be more complicated later
      if (c === "4") {
        cell.solid = true;
      } else {
        cell.solid = false;
      }
    }
  }
}
