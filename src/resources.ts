
import {resolve} from "path";

export function resourcePath(inPath: string) {
  return `file://${resolve(__dirname, "..", inPath)}`;
}

export function filePath(inPath: string) {
  return resolve(__dirname, "..", inPath);
}
