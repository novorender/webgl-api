in vec3 position;
in vec3 color;
out vec3 vertexColor;

layout(std140) uniform CameraUniforms {
    mat4 dummyMatrix;
    mat4 projectionMatrix;
    mat4 viewMatrix;
};

uniform MeshUniforms {
    mat4 modelMatrix;
};

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    vertexColor = color;
}
