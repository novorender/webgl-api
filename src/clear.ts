import { View } from "./view";
import { GL } from "./glEnum";
import { RGBA, UnitFloat, UInt8 } from "./types";
import { ActionBase } from "./actionBase";
import { FrameContext } from "./frameContext";

class Action extends ActionBase {
    // readonly kind = "clear" as const;
    override execute(frameContext: FrameContext, params: ClearAction.Params) {
        const { gl } = this.view;
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
    // export interface Interface extends Action { };
    export function create(view: View): ActionBase {
        return new Action(view);
    }
    export interface Params {
        // readonly kind: "clear";
        readonly color?: RGBA;
        readonly depth?: UnitFloat;
        readonly stencil?: UInt8;
        // readonly normal?: Vec3;
        // readonly linearZ?: number;
    }
}
