// layout(location = 0) in vec4 position;

void main() {
    int x = gl_VertexID % 2 * 2 - 1;
    int y = gl_VertexID / 2 * 2 - 1;
    gl_Position = vec4(x, y, 0, 1);
}
