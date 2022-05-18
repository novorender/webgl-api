layout(location = 0) in vec4 position;
layout(location = 1) in vec4 color;
out vec4 vertexColor;

const int ext = 512;
uniform sampler2D posTex;
uniform sampler2D colTex;

void main() {
#ifdef USE_TEX
    vec2 uv = (vec2(gl_VertexID % ext, gl_VertexID / ext) + .5) / float(ext);
    gl_Position = texture(posTex, uv);
    vertexColor = texture(colTex, uv);
#else
    gl_Position = position;
    vertexColor = color;
#endif
    gl_PointSize = 1.;
}
