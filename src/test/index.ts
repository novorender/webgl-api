import fs from "fs";
import { createJsonRenderer } from "../webgl2-renderer/index.js";
import { quadTex } from "./rectTex.js";
import { multiSample } from "./multiSample.js";
import { vtxCol } from "./vtxCol.js";
import { packed } from "./packed.js";
import { renderTarget } from "./renderTarget.js";
import { multiDraw } from "./multiDraw.js";
import { srgb } from "./srgb.js";
import { multiMaterial } from "./multiMaterial.js";
import { shuffle } from "./shuffle.js";

async function main() {
    const width = 512;
    const height = 512;
    const commands: string[] = [];
    const renderer = createJsonRenderer(commands, width, height);

    // TODO: shuffle index buffers (random enable/disable draw)

    // multiDraw(renderer);
    // multiSample(renderer);
    // multiMaterial(renderer);
    // quadTex(renderer);
    // await vtxCol(renderer);
    // packed(renderer);
    // renderTarget(renderer, "texture");
    shuffle(renderer);
    // srgb(renderer);

    renderer.dispose();

    const json = `[\n${commands.join(",\n")}\n]`;
    fs.writeFileSync("static/test.json", json);
}

main();