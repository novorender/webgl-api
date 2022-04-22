#version 300 es
precision highp float;

out vec4 fragColor;

uniform RectUniforms {
    vec2 scale;
    vec2 offset;
    vec4 color;
};

void main() {
    // vec2 uv = gl_FragCoord.xy / resolution;
    // gl_FragColor = vec4(color, 1.0);
    // gl_FragColor = texture2D(tex, uv);
    fragColor = color;
}
