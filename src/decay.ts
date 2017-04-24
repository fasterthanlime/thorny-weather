
import * as ex from "excalibur";
import {MapSpec, inMap} from "./parse-map";
import {updateMap} from "./update-map";
import {Player, StoppedEvent} from "./player";
import {IColRow} from "./types";
import constants from "./constants";

export class Decay extends ex.Actor {
  time = 0;
  emitters: ex.ParticleEmitter[] = [];

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

    let toExplode: IColRow[] = [];
    let toExplodeNext: IColRow[] = [];
    toExplode.push(colRow);

    while (toExplode.length) {
      for (const explColRow of toExplode) {
        if (explode) {
          const emitter = new ex.ParticleEmitter(0, 0, 858, 385);
          emitter.emitterType = ex.EmitterType.Circle;
          emitter.radius = 15;
          emitter.minVel = 50;
          emitter.maxVel = 170;
          emitter.minAngle = 0;
          emitter.maxAngle = 6.2;
          emitter.isEmitting = true;
          emitter.emitRate = 250;
          emitter.opacity = 0.37;
          emitter.fadeFlag = true;
          emitter.particleLife = 400;
          emitter.maxSize = 10;
          emitter.minSize = 1;
          emitter.startSize = 0;
          emitter.endSize = 0;
          emitter.acceleration = new ex.Vector(0, 95);
          emitter.beginColor = ex.Color.Vermillion;
          emitter.endColor = ex.Color.Rose;
          emitter.pos.x = (explColRow.col + .5) * constants.cellWidth;
          emitter.pos.y = (explColRow.row + .5) * constants.cellHeight;
          this.emitters.push(emitter);
        }

        for (const dcol of [-1, 0, 1]) {
          for (const drow of [-1, 0, 1]) {
            const col = explColRow.col + dcol;
            const row = explColRow.row + drow;
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
              if (explode && inSpec === "4") {
                toExplodeNext.push({col, row});
              }
              if (spec) {
                this.mapSpec[row][col] = spec;
              }
            }
          }
        }
      }

      toExplode = toExplodeNext;
      toExplodeNext = [];
    }

    let unlock = true;
    outer: for (let row = 0; row < constants.mapRows; row++) {
      for (let col = 0; col < constants.mapCols; col++) {
        const inSpec = this.mapSpec[row][col];
        if (inSpec === "5") {
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

  update(engine, delta) {
    while (this.emitters.length) {
      const emitter = this.emitters.shift();
      engine.add(emitter);
      setTimeout(() => {
        emitter.isEmitting = false;
      }, 100);
      setTimeout(() => {
        emitter.kill();
      }, 500);
    }
  }
}
