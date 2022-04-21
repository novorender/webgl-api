import { ClearAction } from "./clear";
import { DrawCubeAction } from "./drawCube";
import { FillRectAction } from "./fillRect";
import { View } from "./view";

export function getActionTypes(view: View) {
    const actionNamespaces = {
        clear: ClearAction,
        fill_rect: FillRectAction,
        draw_cube: DrawCubeAction,
    } as const;

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

type AT = ReturnType<typeof getActionTypes>;
type ActionKind = keyof AT;
export type RenderActionData = { readonly kind: ActionKind };
