import { FrameContext } from "./frameContext";
import { View } from "./view";

export abstract class ActionBase {
    constructor() { }
    dispose(): void { }
    abstract execute(frameContext: FrameContext, args: unknown): void;
}
