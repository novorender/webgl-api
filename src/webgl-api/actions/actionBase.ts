// import type { FrameContext } from "lib/frameContext";
import type { FrameContext } from "../frameContext";

export interface ActionCtorArgs {
    readonly gl: WebGL2RenderingContext;
};

export abstract class ActionBase {
    constructor(readonly args: ActionCtorArgs) { }
    dispose(): void { }
    abstract execute(frameContext: FrameContext, args: unknown): void;
}
