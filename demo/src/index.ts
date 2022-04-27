import { createView, downloadRenderState } from "@novorender/webgl-api";

async function main(canvas: HTMLCanvasElement) {
    const url = new URL("./test.jsonc", location.origin);
    const { renderState, binary } = await downloadRenderState(url);
    const view = createView(canvas);
    view.render(renderState, binary);
}

main(document.getElementById("container") as HTMLCanvasElement);