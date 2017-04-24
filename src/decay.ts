
import * as ex from "excalibur";
import {MapSpec, inMap} from "./parse-map";
import {updateMap} from "./update-map";
import {Player, StoppedEvent} from "./player";
import {IColRow} from "./types";
import constants from "./constants";

export class Decay extends ex.Actor {
  time = 0;

  constructor(
    public tilemap: ex.TileMap,
    public sheet: ex.SpriteSheet,
    public mapSpec: MapSpec,
    public player: Player,
  ) {
    super();
    player.on("stopped", (ev: StoppedEvent) => {
      this.turn(ev.colRow);
    });
  }

  turn(colRow: IColRow) {
    ex.Logger.getInstance().info(`turn at ${JSON.stringify(colRow)}`);

    const nextMapping = {
      "0": "1",
      "1": "2",
      "2": "3",
      "3": "4",
      "4": "5",
      "5": "5",
    };

    const explodeMapping = {
      "5": "4",
      "4": "2",
      "3": "1",
      "2": "1",
      "1": "1",
    };

    let explode = false;
    {
      const c = this.mapSpec[colRow.row][colRow.col];
      if (c === "4") {
        explode = true;
        this.emit("exploded");
      }
    }

    for (const dcol of [-1, 0, 1]) {
      for (const drow of [-1, 0, 1]) {
        const col = colRow.col + dcol;
        const row = colRow.row + drow;
        if (inMap({ col, row })) {
          const inSpec = this.mapSpec[row][col];
          let spec: string;
          if (dcol === 0 && drow === 0) {
            if (explode) {
              spec = "0";
            } else {
              spec = nextMapping[inSpec];
            }
          } else {
            if (explode) {
              spec = explodeMapping[inSpec];
            } else {
              spec = nextMapping[inSpec];
            }
          }
          if (spec) {
            this.mapSpec[row][col] = spec;
          }
        }
      }
    }

    let unlock = true;
    outer: for (let row = 0; row < constants.mapRows; row++) {
      for (let col = 0; col < constants.mapCols; col++) {
        const inSpec = this.mapSpec[row][col];
        if (inSpec === "0") {
          unlock = false;
          break outer;
        }
      }
    }

    if (unlock) {
      let didUnlock = false;
      for (let row = 0; row < constants.mapRows; row++) {
        for (let col = 0; col < constants.mapCols; col++) {
          const inSpec = this.mapSpec[row][col];
          if (inSpec === "l") {
            this.mapSpec[row][col] = "1";
            didUnlock = true;
          }
        }
      }

      if (didUnlock) {
        this.emit("unlocked");
      }
    }

    updateMap(this.tilemap, this.sheet, this.mapSpec);
  }
}
