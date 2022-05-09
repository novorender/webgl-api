layout(location = 0) in vec4 pos0;
layout(location = 1) in vec4 pos1;
layout(location = 2) in vec4 pos2;
layout(location = 3) in vec4 color;
out vec4 triangleColor;

void main() {
    switch(gl_VertexID) {
        case 0:
            gl_Position = pos0;
            break;
        case 1:
            gl_Position = (gl_InstanceID % 2 == 0) ? pos1 : pos2;
            break;
        case 2:
            gl_Position = (gl_InstanceID % 2 == 0) ? pos2 : pos1;
            break;
    }
    triangleColor = color;
}
