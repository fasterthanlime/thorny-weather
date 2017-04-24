
import {resolve} from "path";

export function resourcePath(inPath: string) {
  return `file://${resolve(__dirname, "..", inPath)}`;
}
