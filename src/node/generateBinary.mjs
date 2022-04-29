import fs from "fs";
const chunks = {
    pos: new Float32Array([
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
        -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
        -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
        -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1
    ]),

    tex0: new Float32Array([
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
    ]),

    col: new Float32Array([
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1
    ]),

    idx: new Uint8Array([
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23
    ]),

    tex: new Uint8Array([
        255, 0, 0, 255, 0, 255, 0, 255, 0,
        0, 255, 255, 255, 255, 255, 255
    ]),
}

let offset = 0;

function write(name) {
    const buffer = chunks[name];
    const len = fs.writeSync(file, buffer);
    console.log(`${name}: {"byteOffset": ${offset}, "byteLength":${len}}`);
    offset += len;
}

const file = fs.openSync("static/test.bin", "w");
write("pos");
write("tex0");
write("col");
write("idx");
write("tex");
console.log(`Total size: ${offset}`);
fs.closeSync(file);
