layout(location = 0) in vec4 pos0;
layout(location = 1) in vec4 pos1;
layout(location = 2) in vec4 pos2;
layout(location = 3) in vec4 color;
uniform mat4 worldClipMatrix;
out vec4 triangleColor;

void main() {
    vec4 pos;
    switch(gl_VertexID) {
        case 0:
            pos = pos0;
            break;
        case 1:
            // pos = (gl_InstanceID % 2 == 0) ? pos1 : pos2;
            pos = pos1;
            break;
        case 2:
            // pos = (gl_InstanceID % 2 == 0) ? pos2 : pos1;
            pos = pos2;
            break;
    }
    gl_Position = worldClipMatrix * pos;
    triangleColor = color * 0.5;
}
