import fs from "fs";
import { createJsonRenderer } from "../webgl2-renderer/index.js";
import { quadTex } from "./rectTex.js";
import { multiSample } from "./multiSample.js";
import { vtxCol } from "./vtxCol.js";
import { packed } from "./packed.js";

async function main() {
    const width = 1024;
    const height = 1024;
    const commands: string[] = [];
    const renderer = createJsonRenderer(commands, width, height);
    // quadTex(renderer);
    // multiSample(renderer);
    // await vtxCol(renderer);
    packed(renderer);

    renderer.dispose();

    const json = `[\n${commands.join(",\n")}\n]`;
    fs.writeFileSync("static/test.json", json);
}

main();