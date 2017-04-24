
import {IColRow} from "./types";

export function snap(cr: IColRow): IColRow {
  return {
    col: Math.round(cr.col),
    row: Math.round(cr.row),
  };
}

export function add(a: IColRow, b: IColRow): IColRow {
  return {
    col: a.col + b.col,
    row: a.row + b.row,
  };
}

export function mul(a: IColRow, factor: number): IColRow {
  return {
    col: a.col * factor,
    row: a.row * factor,
  };
}
