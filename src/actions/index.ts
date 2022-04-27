import { ClearAction } from "./clear";
import { DrawMeshAction } from "./drawMesh";
import type { ActionCtorArgs } from "./actionBase";

const actionNamespaces = {
    clear: ClearAction,
    draw_mesh: DrawMeshAction,
} as const;

export function getActionTypes(args: ActionCtorArgs) {
    // create action types lazily through getters
    const actionTypes = {};
    for (const [key, value] of Object.entries(actionNamespaces)) {
        Object.defineProperty(actionTypes, key, {
            enumerable: true,
            configurable: false,
            get() {
                const privateKey = `#${key}`;
                if (!this[privateKey]) {
                    this[privateKey] = value.create(args);
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
