
import * as ex from "excalibur";

import constants from "./constants";
import {resourcePath} from "./resources";
import {MapSpec, inMap} from "./parse-map";
import {IColRow} from "./types";
import * as guide from "./guide";

export class Player extends ex.Actor {
  state = PlayerState.Idle;
  dir = Dir.Right;
  colRow: IColRow = {col: 1, row: 1};
  sprite: ex.Sprite;
  anims: IAnims;
  restTime = 0;

  constructor(public mapSpec: MapSpec) {
    super();
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

    const orig = guide.snap(this.colRow);
    const target = guide.snap(guide.add(this.colRow, d));

    const cell = this.mapSpec[target.row][target.col];
    if (cell === "4" || cell === "5") {
      const far = guide.add(this.colRow, guide.mul(d, .25));
      const near = guide.snap(this.colRow);

      this.state = PlayerState.Walk;
      const forth = new TWEEN.Tween(this.colRow).to(far, 100).onUpdate(() => {
        this.updatePos();
      }).onComplete(() => {
        if (cell === "4") {
          this.emit("stopped", new StoppedEvent(target));
        }
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
    new TWEEN.Tween(this.colRow).to(target, 400).onUpdate(() => {
      this.updatePos();
    }).onComplete(() => {
      this.state = PlayerState.Idle;
      this.updateAnim();
      if (cell === "0") {
        this.emit("stopped", new StoppedEvent(this.colRow));
      }
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

export enum PlayerState {
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

export class StoppedEvent extends ex.GameEvent<Player> {
  colRow: IColRow = {col: 0, row: 0};

  constructor(colRow: IColRow) {
    super();
    this.colRow.col = colRow.col;
    this.colRow.row = colRow.row;
  }
}

export enum Dir {
  Up,
  Left,
  Down,
  Right,
}

export function dirToDelta(dir: Dir): IColRow {
  switch (dir) {
    case Dir.Up:
      return { col: 0, row: -1 };
    case Dir.Left:
      return { col: -1, row: 0 };
    case Dir.Down:
      return { col: 0, row: 1 };
    case Dir.Right:
      return { col: 1, row: 0 };
  }
}

export function dirToString(dir: Dir): string {
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

export interface IAnims {
  [key: string]: ex.Animation;
}