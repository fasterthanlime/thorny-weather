
import * as ex from "excalibur";

import glob from "./glob";
import * as TWEEN from "tween.js";

import constants from "./constants";
import { resourcePath } from "./resources";
import { MapSpec, parseJsonMap, inMap } from "./parse-map";
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

const jsonMaps = [
  "sprout",
];

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

  const unlockSfx = new SFX("unlock");
  await unlockSfx.load();

  const lockSfx = new SFX("lock");
  await lockSfx.load();

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

  const label = new ex.Label();
  label.fontFamily = "Arial, sans-serif";
  label.fontSize = 20;
  label.fontUnit = ex.FontUnit.Px;
  label.text = "Yoko boom";
  label.color = ex.Color.White;
  label.pos.setTo(10, game.getDrawHeight() - 10);
  game.add(label);

  const instructLabel = new ex.Label();
  instructLabel.fontFamily = "Arial, sans-serif";
  instructLabel.fontSize = 20;
  instructLabel.fontUnit = ex.FontUnit.Px;
  instructLabel.text = "Press [R] to restart";
  instructLabel.color = ex.Color.White;
  instructLabel.textAlign = ex.TextAlign.Right;
  instructLabel.pos.setTo(game.getDrawWidth() - 10, game.getDrawHeight() - 10);
  game.add(instructLabel);

  const setupState = () => {
    // const mapName = Object.keys(maps)[mapIndex];
    // label.text = mapName;

    state.player.on("won", () => nextMap());
    state.player.on("walked", () => {
      walkSfx.play();
    });

    state.decay.on("exploded", () => {
      explodeSfx.play();
    });
    state.decay.on("unlocked", () => {
      unlockSfx.play();
    });
    state.decay.on("locked", () => {
      lockSfx.play();
    });

    updateMap(tilemap, sheet, state.mapSpec);
  };

  const nextMap = async (delta = 1, won = true) => {
    if (won) {
      winSfx.play();
    }
    mapIndex = (mapIndex + delta) % jsonMaps.length;
    state.player.kill();
    state.decay.kill();
    state = await loadMap(game, tilemap, sheet, mapIndex);
    setupState();
  };

  mapIndex = constants.startMap;
  state = await loadMap(game, tilemap, sheet, mapIndex);
  setupState();

  const skipper = new ex.Actor();
  skipper.update = (engine, step) => {
    if (engine.input.keyboard.wasPressed(ex.Input.Keys.R)) {
      nextMap(0, false);
    } else if (engine.input.keyboard.wasPressed(ex.Input.Keys.N)) {
      nextMap(1, false);
    }
  };
  game.add(skipper);
}

async function loadMap(
    game: ex.Engine, tilemap: ex.TileMap, sheet: ex.SpriteSheet, mapIndex: number): Promise<IGameState> {
  const mapPath = jsonMaps[mapIndex];
  ex.Logger.getInstance().info(`Loading map #${mapIndex}: ${mapPath}`);

  const mapSpec = await parseJsonMap(mapPath);

  const player = new Player(mapSpec);
  game.add(player);
  await player.load(game);

  const decay = new Decay(tilemap, sheet, mapSpec, player);
  game.add(decay);

  return {player, decay, mapSpec};
}

document.addEventListener("DOMContentLoaded", boot);
