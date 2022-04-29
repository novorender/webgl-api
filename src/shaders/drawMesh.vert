layout(location = 0) in vec4 position;
layout(location = 2) in vec4 color0;
layout(location = 3) in vec2 tex0;

out vec4 vertexColor;
out vec2 texCoord;

layout(std140) uniform CameraUniforms {
    mat4 dummyMatrix;
    mat4 projectionMatrix;
    mat4 viewMatrix;
};

layout(std140) uniform MaterialUniforms {
    vec4 baseColor;
};

layout(std140) uniform InstanceUniforms {
    mat4 modelMatrix;
};

uniform sampler2D baseColorSampler;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    vertexColor = color0;
    texCoord = tex0;
}
