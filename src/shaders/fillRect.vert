#version 300 es

in vec2 position;
uniform vec2 scale;
uniform vec2 offset;

void main() {
    vec2 xy = position * scale + offset * 2.0 - 1.0;
    gl_Position = vec4(xy, 0.0, 1.0);
}
