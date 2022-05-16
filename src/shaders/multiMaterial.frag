layout(std140) uniform MaterialColors {
    uvec4 colors[64 * 64];
};
flat in int material;
out vec4 fragColor;

vec4 unpackColor(uint rgba) {
    return vec4(rgba >> 0 & 0xffU, rgba >> 8 & 0xffU, rgba >> 16 & 0xffU, rgba >> 24 & 0xffU) / 255.;
}

void main() {
    fragColor = unpackColor(colors[material / 4][material % 4]);
}
