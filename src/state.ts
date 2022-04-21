import type { RenderActionData } from "./actions";

export interface RenderState {
    readonly view?: RenderStateView;
    readonly actions: readonly RenderActionData[];
}

export interface RenderStateView {
    readonly width: number;
    readonly height: number;
}
