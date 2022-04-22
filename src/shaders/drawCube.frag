#version 300 es
precision highp float;

in vec3 vertexColor;
out vec4 fragColor;

uniform CameraUniforms {
    mat4 projectionMatrix;
    mat4 viewMatrix;
};

uniform MeshUniforms {
    mat4 modelMatrix;
};

void main() {
    fragColor = vec4(vertexColor, 1.);
}
