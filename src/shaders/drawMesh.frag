in vec3 vertexColor;
out vec4 fragColor;

layout(std140) uniform CameraUniforms {
    mat4 dummyMatrix;
    mat4 projectionMatrix;
    mat4 viewMatrix;
};

uniform MeshUniforms {
    mat4 modelMatrix;
};

void main() {
    fragColor = vec4(vertexColor, 1.);
}
