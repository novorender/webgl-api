uniform vec4 color;
uniform sampler2D tex;
in vec2 texCoord0;
out vec4 fragColor;

void main() {
    // fragColor = vec4(texture(tex, texCoord0).rgb, 1);
    fragColor = texture(tex, texCoord0);
    // fragColor = vec4(texCoord0, 0, 1);
    // fragColor = color;
}
