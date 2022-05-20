import type { Pixels, Renderer } from "@novorender/renderer";
import type { JsonRendererCommand } from "@novorender/renderer/json";

export function replay(renderer: Renderer, commands: readonly JsonRendererCommand[]) {
    const startRenderIndex = commands.findIndex(c => !c[0].startsWith("create"));
    console.assert(startRenderIndex >= 0);
    const resourceCreationCommands = commands.slice(0, startRenderIndex);
    const renderCommands = commands.slice(startRenderIndex);
    console.assert(renderCommands.every(c => !c[0].startsWith("create"))); // verify that there are no resource creation commands after the initial bulk
    for (const command of resourceCreationCommands) {
        const [name, ...args] = command;
        const func = renderer[name] as Function;
        func.apply(renderer, args);
    }

    return function render(time: number) {
        let measurement: Promise<number> | undefined;
        let pixels: Promise<Pixels> | undefined;
        for (const command of renderCommands) {
            const [name, ...args] = command;
            const func = renderer[name] as Function;
            const promise = func.apply(renderer, args);
            if (promise && typeof promise == "object" && promise instanceof Promise) {
                switch (name) {
                    case "measureEnd": {
                        console.assert(!measurement); // there can only be one measurement per frame
                        measurement = promise as ReturnType<Renderer["measureEnd"]>;
                        break;
                    }
                    case "readPixels": {
                        console.assert(!pixels); // currently there can only be one set of pixels per frame
                        pixels = promise as ReturnType<Renderer["readPixels"]>;
                        break;
                    }
                }

            }
        }
        return { measurement, pixels };
    }
}