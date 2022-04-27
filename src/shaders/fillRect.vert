in vec2 position;

uniform RectUniforms {
    vec2 scale;
    vec2 offset;
    vec4 color;
};

void main() {
    vec2 xy = position * scale * 2. + offset * 2. - 1.;
    gl_Position = vec4(xy, 0, 1);
}
