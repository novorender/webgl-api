import { GL } from "../glEnum";
import type { RGBA, UnitFloat, UInt8 } from "../types";
import type { FrameContext } from "../frameContext";
import { ActionBase, ActionCtorArgs } from "./actionBase";

class Action extends ActionBase {
    constructor(args: ActionCtorArgs) {
        super(args);
    }

    override execute(frameContext: FrameContext, params: ClearAction.Params) {
        const { gl } = frameContext;
        const { color, depth, stencil } = params;
        let mask = 0;
        if (color) {
            mask |= GL.COLOR_BUFFER_BIT;
            const [r, g, b, a] = color;
            gl.clearColor(r, g, b, a ?? 1);
        }
        if (depth) {
            mask |= GL.DEPTH_BUFFER_BIT;
            gl.clearDepth(depth);
        }
        if (stencil) {
            mask |= GL.STENCIL_BUFFER_BIT;
            gl.clearStencil(stencil);
        }
        if (mask)
            gl.clear(mask);
    }
}

export namespace ClearAction {
    export function create(args: ActionCtorArgs): ActionBase {
        return new Action(args);
    }
    export interface Params {
        readonly color?: RGBA;
        readonly depth?: UnitFloat;
        readonly stencil?: UInt8;
        // readonly normal?: Vec3;
        // readonly linearZ?: number;
    }
    export interface Data extends Params {
        readonly kind: "clear";
    }
    export declare const data: Data;
}
