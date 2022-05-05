import type { Renderer } from "@novorender/webgl2-renderer";

export type Command = readonly [name: keyof Renderer, args: any[]];

export function replay(renderer: Renderer, commands: readonly Command[]) {
    for (let command of commands) {
        const [name, ...args] = command;
        const func = renderer[name] as Function;
        func.apply(renderer, args);
    }
}