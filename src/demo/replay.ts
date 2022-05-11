import type { Renderer } from "@novorender/webgl2-renderer";

export type Command = readonly [name: keyof Renderer, args: any[]];

export function replay(renderer: Renderer, commands: readonly Command[]) {
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
        for (const command of renderCommands) {
            const [name, ...args] = command;
            const func = renderer[name] as Function;
            func.apply(renderer, args);
        }
    }
}