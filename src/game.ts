
import * as ex from "excalibur";

import {resolve} from "path";
import glob from "./glob";
import * as TWEEN from "tween.js";

import constants from "./constants";
import maps from "./maps";
import {MapSpec, parseMap, inMap} from "./parse-map";
import {updateMap} from "./update-map";
import * as random from "./random";
import {IColRow} from "./types";

function resourcePath(inPath: string) {
  return `file://${resolve(__dirname, "..", inPath)}`;
}

enum Dir {
  Up,
  Left,
  Down,
  Right,
}

function dirToDelta(dir: Dir): IColRow {
  switch (dir) {
    case Dir.Up:
      return {col: 0, row: -1};
    case Dir.Left:
      return {col: -1, row: 0};
    case Dir.Down:
      return {col: 0, row: 1};
    case Dir.Right:
      return {col: 1, row: 0};
  }
}

function dirToString(dir: Dir): string {
  switch (dir) {
    case Dir.Up:
      return "up";
    case Dir.Left:
      return "left";
    case Dir.Down:
      return "down";
    case Dir.Right:
      return "right";
  }
}

interface IAnims {
  [key: string]: ex.Animation;
}

class Tweener extends ex.Actor {
  update(engine, delta) {
    TWEEN.update();
  }
}

class Decay extends ex.Actor {
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

    const prevMapping: {
      [key: string]: string;
    } = {};
    for (const key of Object.keys(nextMapping)) {
      prevMapping[nextMapping[key]] = key;
    }

    for (const dcol of [-1, 0, 1]) {
      for (const drow of [-1, 0, 1]) {
        const col = colRow.col + dcol;
        const row = colRow.row + drow;
        if (inMap({col, row})) {
          let spec: string;
          if (dcol === 0 && drow === 0) {
            spec = "0";
          } else {
            ex.Logger.getInstance().info(`Decaying ${col}, ${row}`);
            spec = nextMapping[this.mapSpec[row][col]];
          }
          if (spec) {
            this.mapSpec[row][col] = spec;
          }
        }
      }
    }

    updateMap(this.tilemap, this.sheet, this.mapSpec);
  }
}

enum PlayerState {
  Idle,
  Rest,
  Walk,
}

function playerStateToAnim(ps: PlayerState): string {
  switch (ps) {
    case PlayerState.Idle: return "idle";
    case PlayerState.Rest: return "idle";
    case PlayerState.Walk: return "walk";
  }
}

class StoppedEvent extends ex.GameEvent<Player> {
  colRow: IColRow = {col: 0, row: 0};

  constructor(colRow: IColRow) {
    super();
    this.colRow.col = colRow.col;
    this.colRow.row = colRow.row;
  }
}

class Player extends ex.Actor {
  state = PlayerState.Idle;
  dir = Dir.Right;
  colRow: IColRow = {col: 1, row: 1};
  sprite: ex.Sprite;
  anims: IAnims;
  tilemap: ex.TileMap;
  restTime = 0;

  constructor(tilemap: ex.TileMap) {
    super();
    this.tilemap = tilemap;
    this.updatePos();
  }

  async load(engine: ex.Engine) {
    const sokoTex = new ex.Texture(resourcePath("images/sokoban_tilesheet.png"));
    await sokoTex.load();

    const cellSide = 64;  
    const sheet = new ex.SpriteSheet(
      sokoTex,
      sokoTex.width / cellSide, sokoTex.height / cellSide,
      cellSide, cellSide,
    );

    const tileIndex = ({col, row}): number => {
      return col + row * sheet.columns;
    };

    this.anims = {};
    const loadAnim = (name: string, xys: IColRow[]) => {
      const anim = sheet.getAnimationByIndices(
        engine,
        xys.map(tileIndex),
        200,
      );
      anim.loop = true;
      this.anims[name] = anim;
      this.addDrawing(name, this.anims[name]);
    };

    loadAnim("idle-down", [
      { col: 0, row: 5 },
    ]);
    loadAnim("walk-down", [
      { col: 1, row: 5 },
      { col: 0, row: 5 },
      { col: 2, row: 5 },
      { col: 0, row: 5 },
    ]);
    loadAnim("idle-up", [
      { col: 3, row: 5 },
    ]);
    loadAnim("walk-up", [
      { col: 4, row: 5 },
      { col: 3, row: 5 },
      { col: 5, row: 5 },
      { col: 3, row: 5 },
    ]);

    loadAnim("idle-right", [
      { col: 0, row: 7 },
    ]);
    loadAnim("walk-right", [
      { col: 1, row: 7 },
      { col: 0, row: 7 },
      { col: 2, row: 7 },
      { col: 0, row: 7 },
    ]);
    loadAnim("idle-left", [
      { col: 3, row: 7 },
    ]);
    loadAnim("walk-left", [
      { col: 4, row: 7 },
      { col: 3, row: 7 },
      { col: 5, row: 7 },
      { col: 3, row: 7 },
    ]);

    this.updateAnim();
  }

  update(engine, delta) {
    switch (this.state) {
      case PlayerState.Walk:
        // muffin
        break;
      case PlayerState.Rest:
        // don't handle inputs when resting
        this.restTime -= delta;
        if (this.restTime <= 0) {
          this.state = PlayerState.Idle;
        }
        break;
      case PlayerState.Idle:
        this.handleInputs(engine);
        break;
    }
  }

  handleInputs(engine: ex.Engine) {
    if (engine.input.keyboard.isHeld(ex.Input.Keys.W)) {
      this.walk(Dir.Up);
    } else if (engine.input.keyboard.isHeld(ex.Input.Keys.A)) {
      this.walk(Dir.Left);
    } else if (engine.input.keyboard.isHeld(ex.Input.Keys.S)) {
      this.walk(Dir.Down);
    } else if (engine.input.keyboard.isHeld(ex.Input.Keys.D)) {
      this.walk(Dir.Right);
    }
  }

  walk(dir: Dir) {
    const d = dirToDelta(dir);
    ex.Logger.getInstance().info(`walking, d = ${JSON.stringify(d)}`);
    this.dir = dir;

    const cell = this.tilemap.getCell(
      Math.round(this.colRow.col + d.col),
      Math.round(this.colRow.row + d.row),
    );
    if (cell && cell.solid) {
      const far = {
        col: this.colRow.col + .1 * d.col,
        row: this.colRow.row + .1 * d.row,
      };
      const near = {
        col: Math.round(this.colRow.col),
        row: Math.round(this.colRow.row),
      };

      this.state = PlayerState.Walk;
      const forth = new TWEEN.Tween(this.colRow).to(far, 100).onUpdate(() => {
        this.updatePos();
      });
      
      const back = new TWEEN.Tween(this.colRow).to(near, 100).onUpdate(() => {
        this.updatePos();
      }).onComplete(() => {
        this.state = PlayerState.Rest;
        this.restTime = 200;
        this.updateAnim();
      });
      
      forth.chain(back).start();

      this.updateAnim();
      this.emit("walked");
      return;
    }

    this.state = PlayerState.Walk;
    this.updateAnim();
    new TWEEN.Tween(this.colRow).to({
      col: this.colRow.col + d.col,
      row: this.colRow.row + d.row,
    }, 400).onUpdate(() => {
      this.updatePos();
    }).onComplete(() => {
      this.state = PlayerState.Idle;
      this.updateAnim();
      this.emit("stopped", new StoppedEvent(this.colRow));
    }).start();

    this.emit("walked");
  }

  playAnim(animName: string, play = true) {
    const log = ex.Logger.getInstance();
    const anim = this.anims[animName];
    if (anim) {
      this.setDrawing(animName);
    } else {
      log.warn(`couldn't find ${animName}`);
    }
  }

  updatePos() {
    this.pos.x = (.5 + this.colRow.col) * constants.cellWidth;
    this.pos.y = (.5 + this.colRow.row) * constants.cellHeight;
  }

  updateAnim() {
    this.playAnim(`${playerStateToAnim(this.state)}-${dirToString(this.dir)}`);
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

  const walkSounds = [];
  const walkSoundPaths = await glob("sounds/walk*.wav");
  for (const walkSoundPath of walkSoundPaths) {
    const urlPath = resourcePath(walkSoundPath);
    log.info("Found sound " + urlPath);
    const sound = new ex.Sound(urlPath);
    await sound.load();
    sound.setVolume(.4);
    walkSounds.push(sound);
  }

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

  const cellIndex = ({x, y}): number => {
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

  const player = new Player(tilemap);
  game.add(player);

  player.on("walked", () => {
    const index = Math.floor(Math.random() * (walkSounds.length - 1));
    walkSounds[index].play();
  });
  await player.load(game);

  const decay = new Decay(tilemap, sheet, mapSpec, player);
  game.add(decay);

  game.start();
}

document.addEventListener("DOMContentLoaded", boot);
