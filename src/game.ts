
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

interface IGameState {
  player: Player;
  decay: Decay;
  mapSpec: MapSpec;
}

async function startGame() {
  let state: IGameState;

  const game = new ex.Engine({
    width: constants.windowWidth,
    height: constants.windowHeight,
    canvasElementId: "game",
  });
  game.start();

  game.backgroundColor = new ex.Color(.83, .82, .71);
  game.add(new Tweener());

  const log = ex.Logger.getInstance();
  log.info("Loading sounds...");

  const walkSfx = new SFX("walk");
  await walkSfx.load();
  const explodeSfx = new SFX("explode");
  await explodeSfx.load();
  const winSfx = new SFX("win");
  await winSfx.load();

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

  let mapIndex = 0;

  const tilemap = new ex.TileMap(
    0, 0,
    constants.cellWidth, constants.cellHeight,
    constants.mapRows, constants.mapCols,
  );
  tilemap.registerSpriteSheet("main", sheet);
  game.add(tilemap);

  const setupState = () => {
    state.player.on("won", nextMap);
    state.player.on("walked", () => {
      walkSfx.play();
    });

    state.decay.on("exploded", () => {
      explodeSfx.play();
    });

    updateMap(tilemap, sheet, state.mapSpec);
  };

  const nextMap = async () => {
    winSfx.play();
    mapIndex = (mapIndex + 1) % Object.keys(maps).length;
    state.player.kill();
    state.decay.kill();
    state = await loadMap(game, tilemap, sheet, mapIndex);
    setupState();
  };

  state = await loadMap(game, tilemap, sheet, 0);
  setupState();
}

async function loadMap(
    game: ex.Engine, tilemap: ex.TileMap, sheet: ex.SpriteSheet, mapIndex: number): Promise<IGameState> {
  const mapName = Object.keys(maps)[mapIndex];
  const map = maps[mapName];
  ex.Logger.getInstance().info(`Loading map #${mapIndex}: ${mapName}`);
  const mapSpec = parseMap(map);

  const player = new Player(mapSpec);
  game.add(player);
  await player.load(game);

  const decay = new Decay(tilemap, sheet, mapSpec, player);
  game.add(decay);

  return {player, decay, mapSpec};
}

document.addEventListener("DOMContentLoaded", boot);
