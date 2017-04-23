
import * as ex from "excalibur";
import constants from "./constants";
import {resolve} from "path";
import glob from "./glob";

function resourcePath(inPath: string) {
  return `file://${resolve(__dirname, "..", inPath)}`;
}

class KeyHandler extends ex.Actor {
  update(engine, delta) {
    if (engine.input.keyboard.wasPressed(ex.Input.Keys.W)) {
      this.emit("plop");
    }
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
  log.defaultLevel = ex.LogLevel.Debug;
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

  const keyhandler = new KeyHandler();
  game.add(keyhandler);

  keyhandler.on("plop", () => {
    const index = Math.floor(Math.random() * (walkSounds.length - 1));
    log.info("Plopping, index ", index);
    walkSounds[index].play();
  });

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

  game.start();
}

document.addEventListener("DOMContentLoaded", boot);
