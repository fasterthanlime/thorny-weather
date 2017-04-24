
import * as ex from "excalibur";

import glob from "./glob";
import * as TWEEN from "tween.js";

import constants from "./constants";
import { resourcePath } from "./resources";
import maps from "./maps";
import { MapSpec, parseMap, inMap } from "./parse-map";
import { updateMap } from "./update-map";
import * as random from "./random";
import { IColRow } from "./types";
import {Player, StoppedEvent} from "./player";
import {Decay} from "./decay";
import SFX from "./sfx";

class Tweener extends ex.Actor {
  update(engine, delta) {
    TWEEN.update();
  }
}

function boot() {
  startGame().then(() => {
    // yay
  }).catch((e) => {
    console.error("Top-level game error: ", e);
  });
}

async function startGame() {
  const game = new ex.Engine({
    width: constants.windowWidth,
    height: constants.windowHeight,
    canvasElementId: "game",
  });

  const log = ex.Logger.getInstance();
  log.info("Loading sounds...");

  const walkSfx = new SFX("walk");
  await walkSfx.load();
  const explodeSfx = new SFX("explode");
  await explodeSfx.load();

  game.backgroundColor = new ex.Color(.83, .82, .71);
  game.add(new Tweener());

  const sheetTex = new ex.Texture(resourcePath("images/tiles.png"));
  await sheetTex.load();

  const cellSide = 64;
  const sheet = new ex.SpriteSheet(
    sheetTex,
    sheetTex.width / cellSide, sheetTex.height / cellSide,
    cellSide, cellSide,
  );

  const cellIndex = ({ x, y }): number => {
    return x + y * constants.mapCols;
  };

  const tilemap = new ex.TileMap(
    0, 0,
    constants.cellWidth, constants.cellHeight,
    constants.mapRows, constants.mapCols,
  );
  tilemap.registerSpriteSheet("main", sheet);

  const mapSpec = parseMap(maps.start);
  updateMap(tilemap, sheet, mapSpec);
  game.add(tilemap);

  const player = new Player(mapSpec);
  game.add(player);

  player.on("walked", () => {
    walkSfx.play();
  });
  await player.load(game);

  const decay = new Decay(tilemap, sheet, mapSpec, player);
  game.add(decay);

  decay.on("exploded", () => {
    explodeSfx.play();
  });

  game.start();
}

document.addEventListener("DOMContentLoaded", boot);
