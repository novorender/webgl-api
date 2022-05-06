import fs from "fs";
import { createJsonRenderer } from "../webgl2-renderer/index.js";
import { quadTex } from "./rectTex.js";
import { lineAA } from "./lineAA.js";

const width = 1024;
const height = 512;
const commands: string[] = [];
const renderer = createJsonRenderer(commands, width, height);
// quadTex(renderer);
lineAA(renderer);
renderer.dispose();

const json = `[\n${commands.join(",\n")}\n]`;
fs.writeFileSync("static/test.json", json);
