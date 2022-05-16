uniform uint numVerticesPerObject;
layout(location = 0) in vec4 position;
flat out uint material;

void main() {
    gl_Position = position;
    material = uint(gl_VertexID) / numVerticesPerObject;
}
