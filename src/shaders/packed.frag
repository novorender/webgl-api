in vec4 triangleColor;
out vec4 fragColor;

void main() {
    if(triangleColor.a == 0.)
        discard;
    // fragColor = vec4(1);
    fragColor = triangleColor;
}
