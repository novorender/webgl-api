import fs from "fs";
import { createJsonRenderer } from "../webgl2-renderer/index.js";
import { quadTex } from "./rectTex.js";
import { multiSample } from "./multiSample.js";
import { vtxCol } from "./vtxCol.js";
import { packed } from "./packed.js";
import { renderTarget } from "./renderTarget.js";

async function main() {
    const width = 512;
    const height = 512;
    const commands: string[] = [];
    const renderer = createJsonRenderer(commands, width, height);
    // quadTex(renderer);
    // multiSample(renderer);
    // await vtxCol(renderer);
    packed(renderer);
    // renderTarget(renderer, "texture");

    // TODO: check mac/IOS uint32 render target!
    renderer.dispose();

    const json = `[\n${commands.join(",\n")}\n]`;
    fs.writeFileSync("static/test.json", json);
}

main();