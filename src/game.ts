
import * as ex from "excalibur";
import constants from "./constants";
import {resolve} from "path";
import glob from "./glob";

function resourcePath(inPath: string) {
  return `file://${resolve(__dirname, "..", inPath)}`;
}

enum Dir {
  Up,
  Left,
  Down,
  Right,
}

function dirToDelta(dir: Dir): number[] {
  switch (dir) {
    case Dir.Up:
      return [0, -1];
    case Dir.Left:
      return [-1, 0];
    case Dir.Down:
      return [0, 1];
    case Dir.Right:
      return [1, 0];
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

interface IXY {
  x: number;
  y: number;
}

class Player extends ex.Actor {
  dir: Dir;
  colRow: ex.Vector;
  sprite: ex.Sprite;
  anims: IAnims;

  constructor() {
    super();
    this.dir = Dir.Right;
    this.colRow = new ex.Vector(1, 1);
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

    const tileIndex = ({x, y}): number => {
      return x + y * sheet.columns;
    };

    this.anims = {};
    const loadAnim = (name: string, xys: IXY[]) => {
      this.anims[name] = sheet.getAnimationByIndices(
        engine,
        xys.map(tileIndex),
        125,
      );
      this.addDrawing(name, this.anims[name]);
    };

    loadAnim("walk-down", [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ]);
    loadAnim("walk-up", [
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
    ]);

    loadAnim("walk-right", [
      { x: 0, y: 7 },
      { x: 1, y: 7 },
      { x: 2, y: 7 },
    ]);
    loadAnim("walk-left", [
      { x: 3, y: 7 },
      { x: 4, y: 7 },
      { x: 5, y: 7 },
    ]);
  }

  update(engine, delta) {
    if (engine.input.keyboard.wasPressed(ex.Input.Keys.W)) {
      this.walk(Dir.Up);
    }
    if (engine.input.keyboard.wasPressed(ex.Input.Keys.A)) {
      this.walk(Dir.Left);
    }
    if (engine.input.keyboard.wasPressed(ex.Input.Keys.S)) {
      this.walk(Dir.Down);
    }
    if (engine.input.keyboard.wasPressed(ex.Input.Keys.D)) {
      this.walk(Dir.Right);
    }
  }

  walk(dir: Dir) {
    const [dx, dy] = dirToDelta(dir);
    this.dir = dir;
    // TODO: collision test
    this.colRow.x += dx;
    this.colRow.y += dy;
    this.playAnim(`walk-${dirToString(dir)}`);
    this.updatePos();
    this.emit("walked");
  }

  playAnim(animName: string, play = true) {
    const log = ex.Logger.getInstance();
    const anim = this.anims[animName];
    if (anim) {
      if (play) {
        anim.reset();
      }
      this.setDrawing(animName);
    } else {
      log.warn(`couldn't find ${animName}`);
    }
  }

  updatePos() {
    this.pos.x = (.5 + this.colRow.x) * constants.cellWidth;
    this.pos.y = (.5 + this.colRow.y) * constants.cellHeight;
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
    walkSounds.push(sound);
  }

  game.backgroundColor = new ex.Color(.83, .82, .71);

  const sokoTex = new ex.Texture(resourcePath("images/sokoban_tilesheet.png"));
  await sokoTex.load();

  const cellSide = 64;  
  const sheet = new ex.SpriteSheet(
    sokoTex,
    sokoTex.width / cellSide, sokoTex.height / cellSide,
    cellSide, cellSide,
  );

  const tileIndex = ({x, y}): number => {
    return x + y * sheet.columns;
  };

  const cellIndex = ({x, y}): number => {
    return x + y * constants.mapCols;
  };

  const mapping = {
    "0": {x: 10, y: 6}, // grass tile
    "1": {x: 12, y: 6}, // dirt tile
    "2": {x: 11, y: 6}, // rocks tile
    "3": {x:  8, y: 6}, // concrete tile
    "4": {x:  7, y: 6}, // bricks tile
  };
  
  const map = `
444444444444444
400000000000004
400000000000004
400000000000004
400100020003004
400100020003004
400000000000004
400000000000004
400000000000004
444444444444444
  `;

  const tilemap = new ex.TileMap(
    0, 0, 
    constants.cellWidth, constants.cellHeight,
    constants.mapRows, constants.mapCols,
  );
  tilemap.registerSpriteSheet("main", sheet);

  const mapLines = map.split("\n").filter((x) => x.trim().length > 0);
  {
    let row = 0;
    for (const line of mapLines) {
      for (let column = 0; column < line.length; column++) {
        const cell = tilemap.getCell(column, row);
        cell.pushSprite(new ex.TileSprite("main", tileIndex(mapping["2"])));

        const c = line.charAt(column);
        const tileSpec = mapping[c];
        if (tileSpec) {
          cell.pushSprite(new ex.TileSprite("main", tileIndex(tileSpec)));
        }
      }
      row++;
    }
  }
  game.add(tilemap);

  const player = new Player();
  game.add(player);

  player.on("walked", () => {
    const index = Math.floor(Math.random() * (walkSounds.length - 1));
    walkSounds[index].play();
  });
  await player.load(game);

  game.start();
}

document.addEventListener("DOMContentLoaded", boot);
