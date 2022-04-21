#version 300 es
precision mediump float;

// uniform vec2 resolution;
uniform vec4 color;
// uniform sampler2D tex;
out vec4 fragColor;

void main() {
    // vec2 uv = gl_FragCoord.xy / resolution;
    // gl_FragColor = vec4(color, 1.0);
    // gl_FragColor = texture2D(tex, uv);
    fragColor = color;
}
