layout(std140) uniform MaterialColors {
    vec4 colors[128 * 128];
};
flat in uint material;
out vec4 fragColor;

void main() {
    fragColor = colors[material];
}
