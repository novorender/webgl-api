layout(location = 0) in vec4 pos0;
layout(location = 1) in vec4 pos1;
layout(location = 2) in vec4 pos2;
layout(location = 3) in vec4 color;
layout(location = 4) in highp int edgeMask;
// const highp int edgeMask = 1;

uniform mat4 worldClipMatrix;
out vec4 triangleColor;

void main() {
    vec4 pos;
    switch(gl_VertexID) {
        case 5:
        case 0:
            pos = pos0;
            break;
        case 1:
        case 2:
            pos = pos1;
            break;
        case 3:
        case 4:
            pos = pos2;
            break;
    }
    gl_Position = worldClipMatrix * pos;
    triangleColor = (edgeMask & (1<<(gl_VertexID / 2))) != 0 ? vec4(1) : vec4(color.rgb, 0);
}
