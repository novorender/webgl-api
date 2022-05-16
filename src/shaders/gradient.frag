out vec4 fragColor;
uniform vec2 windowSize;
uniform float gamma;

void main() {
    float i = pow(gl_FragCoord.y / windowSize.y, gamma);
    fragColor = vec4(i, i, i, 1);
}
