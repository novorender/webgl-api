import { createJsonRenderer } from "../webgl2-renderer/index.js";
import { run } from "./run.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shadersDir = path.resolve(__dirname, "../shaders/");
const vertex = fs.readFileSync(path.resolve(shadersDir, "basic.vert"), "utf8");
const fragment = fs.readFileSync(path.resolve(shadersDir, "basic.frag"), "utf8");

const width = 1920;
const height = 1080;
const commands: string[] = [];
const renderer = createJsonRenderer(commands, width, height);

run(renderer, width, height, vertex, fragment);

const json = `[\n${commands.join(",\n")}\n]`;
fs.writeFileSync("static/test.json", json);
