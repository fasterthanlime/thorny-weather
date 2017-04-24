
import * as ex from "excalibur";
import {resolve} from "path";
import glob from "./glob";
import {pick} from "./random";
import {resourcePath} from "./resources";

export default class SFX {
  sounds: ex.Sound[] = [];

  constructor(public name: string) {}

  async load() {
    const globExpr = `${resolve(__dirname, "..")}/sounds/${this.name}*.wav`;
    // tslint:disable-next-line
    console.log(`in sfx, globExpr = ${globExpr}`);
    const paths = await glob(globExpr);
    const promises: ex.Promise<any>[] = [];
    for (const walkSoundPath of paths) {
      const urlPath = resourcePath(walkSoundPath);
      const sound = new ex.Sound(urlPath);
      promises.push(sound.load());
      sound.setVolume(.4);
      this.sounds.push(sound);
    }
    await Promise.all(promises);
  }

  play() {
    const sound = pick(this.sounds)
    if (sound) {
      sound.play();
    }
  }
}
