export type UnitFloat = number; // [0, 1]
// export type SignedUnitFloat = number; // [-1, 1]
export type UInt8 = number; // [0, 255]
export type Vec3 = readonly [x: number, y: number, z: number];
export type Mat4 = readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
export type Quat = readonly [number, number, number, number];

export type RGB = readonly [red: number, green: number, blue: number];
export type RGBA = readonly [red: number, green: number, blue: number, alpha: number];
