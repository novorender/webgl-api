layout(location = 0) in vec2 position;
out vec2 texCoord0;

void main() {
    gl_Position = vec4(position * 2. - 1., 0, 1);
    texCoord0 = position;
}
