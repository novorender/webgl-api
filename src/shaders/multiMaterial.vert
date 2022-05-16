uniform int numVerticesPerObject;
layout(location = 0) in vec4 position;
flat out int material;

void main() {
    gl_Position = position;
    material = gl_VertexID / numVerticesPerObject;
}
