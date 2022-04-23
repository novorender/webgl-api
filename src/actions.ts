import { CameraPerspectiveAction } from "./camera";
import { ClearAction } from "./clear";
// import type { ClearAction } from "./clear";
import { DrawCubeAction } from "./drawCube";
import { FillRectAction } from "./fillRect";
import { View } from "./view";

const actionNamespaces = {
    clear: ClearAction,
    fill_rect: FillRectAction,
    draw_cube: DrawCubeAction,
    camera_perspective: CameraPerspectiveAction
} as const;

export function getActionTypes(view: View) {
    // create action types lazily through getters
    const actionTypes = {};
    for (const [key, value] of Object.entries(actionNamespaces)) {
        Object.defineProperty(actionTypes, key, {
            enumerable: true,
            configurable: false,
            get() {
                const privateKey = `#${key}`;
                if (!this[privateKey]) {
                    this[privateKey] = value.create(view);
                }
                return this[privateKey];
            },
        })
    }
    type TN = typeof actionNamespaces;
    type AT = { readonly [P in keyof TN]: ReturnType<TN[P]["create"]>; };
    return actionTypes as AT;
}


type NT = typeof actionNamespaces[keyof typeof actionNamespaces];
export type RenderActionData = NT["data"];
export type ActionKind = RenderActionData["kind"];
export type ActionTypes = ReturnType<typeof getActionTypes>;
// type AT = ReturnType<typeof getActionTypes>;
// export type ActionKind = keyof AT;
// export type RenderActionData = PT<ActionKind>;
// export type RenderActionData = { readonly kind: ActionKind };
