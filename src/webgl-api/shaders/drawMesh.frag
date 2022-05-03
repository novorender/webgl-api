in vec4 vertexColor;
in vec2 texCoord;

out vec4 fragColor;

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
    vec4 texColor = texture(baseColorSampler, texCoord);
    fragColor = vertexColor * baseColor * texColor;
}
