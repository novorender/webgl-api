import { createView, downloadRenderState } from "@novorender/webgl-api";

import { create } from "@novorender/webgl2-renderer/";


async function main(canvas: HTMLCanvasElement) {
    const url = new URL("./test.jsonc", location.origin);
    const { renderState, blobs } = await downloadRenderState(url);
    const view = createView(canvas);
    view.render(renderState, blobs);
}

main(document.getElementById("container") as HTMLCanvasElement);