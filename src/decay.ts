
import * as ex from "excalibur";
import {MapSpec, inMap} from "./parse-map";
import {updateMap, isLocked} from "./update-map";
import {Player, StoppedEvent} from "./player";
import {IColRow} from "./types";
import constants from "./constants";

const ExplodeBeginColor = new ex.Color(86, 108, 75);
const ExplodeEndColor = new ex.Color(203, 254, 176);

const PoofBeginColor = new ex.Color(255, 255, 255);
const PoofEndColor = new ex.Color(255, 255, 255);

export class Decay extends ex.Actor {
  time = 0;
  emitters: ex.ParticleEmitter[] = [];
  locked = false;

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
    const nextMapping = {
      "0": "1",
      "1": "2",
      "2": "3",
      "3": "4",
      "4": "5",
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

    let thorned = false;
    let sprouted = false;

    while (toExplode.length) {
      for (const explColRow of toExplode) {
        if (explode) {
          this.rejoice(explColRow, ExplodeBeginColor, ExplodeEndColor);
        }

        for (const dcol of [-1, 0, 1]) {
          for (const drow of [-1, 0, 1]) {
            const col = explColRow.col + dcol;
            const row = explColRow.row + drow;
            if (inMap({ col, row })) {
              const inSpec = this.mapSpec[row][col];
              let spec: string;
              if (dcol === 0 && drow === 0) {
                if (inSpec === "i" || inSpec === "l") {
                  // keep ice & locks around
                } else {
                  spec = "0";
                }
              } else {
                if (explode) {
                  spec = explodeMapping[inSpec];
                } else {
                  spec = nextMapping[inSpec];
                  if (spec && (spec === "4" || spec === "5")) {
                    this.rejoice({col, row}, PoofBeginColor, PoofEndColor);
                  }
                  if (spec === "4") {
                    sprouted = true;
                  } else if (spec === "5") {
                    thorned = true;
                  }
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


    if (thorned) {
      this.emit("thorn");
    } else if (sprouted) {
      this.emit("sprout");
    }

    const nowLocked = isLocked(this.mapSpec);
    if (this.locked) {
      if (!nowLocked) {
        this.emit("unlocked");
      }
    } else {
      if (nowLocked) {
        this.emit("locked");
      }
    }
    this.locked = nowLocked;

    updateMap(this.tilemap, this.sheet, this.mapSpec);
  }

  rejoice(colRow: IColRow, begin: ex.Color, end: ex.Color) {
    const emitter = new ex.ParticleEmitter(0, 0, 64, 64);
    emitter.emitterType = ex.EmitterType.Circle;
    emitter.radius = 15;
    emitter.minVel = 80;
    emitter.maxVel = 110;
    emitter.minAngle = 0;
    emitter.maxAngle = 6.2;
    emitter.isEmitting = true;
    emitter.emitRate = 80;
    emitter.opacity = 0.5;
    emitter.particleLife = 300;
    // emitter.maxSize = 10;
    // emitter.minSize = 4;
    emitter.startSize = 10;
    emitter.endSize = 1;
    emitter.acceleration = new ex.Vector(0, 95);
    emitter.beginColor = begin;
    emitter.endColor = end;
    emitter.pos.x = (colRow.col + .5) * constants.cellWidth;
    emitter.pos.y = (colRow.row + .5) * constants.cellHeight;
    this.emitters.push(emitter);
  }

  update(engine, delta) {
    while (this.emitters.length) {
      const emitter = this.emitters.shift();
      engine.add(emitter);
      setTimeout(() => {
        emitter.isEmitting = false;
      }, 150);
      setTimeout(() => {
        emitter.kill();
      }, 2000);
    }
  }
}
