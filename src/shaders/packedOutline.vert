layout(location = 0) in vec3 pos0;
layout(location = 1) in vec3 pos1;
layout(location = 2) in vec3 pos2;
layout(location = 3) in vec4 color;
uniform mat4 worldClipMatrix;
uniform vec4 outlinePlane; // in world space
out vec4 triangleColor;

// const vec4 outlinePlane = vec4(0, 0, 1, 0);

struct Vertex {
    vec3 pos;
    float depth;
};

struct Line {
    vec3 pos[2];
};

Vertex projectVertex(vec3 pos, vec4 plane) {
    float depth = dot(vec4(pos, 1), plane);
    return Vertex(pos, depth);
}

vec3 intersectLineWithPlane(Vertex a, Vertex b) {
    float t = -a.depth / (b.depth - a.depth);
    return mix(a.pos, b.pos, t);
}

Line intersectTriangleWithPlane(Vertex a, Vertex b, Vertex c) {
    vec3 p[2];
    float sa = sign(a.depth);
    float sb = sign(b.depth);
    float sc = sign(c.depth);
    if(sa != sb && sa != sc) {
        p[1] = intersectLineWithPlane(a, b);
        p[0] = intersectLineWithPlane(a, c);
    } else if(sb != sc && sb != sa) {
        p[1] = intersectLineWithPlane(b, c);
        p[0] = intersectLineWithPlane(b, a);
    } else if(sc != sa && sc != sb) {
        p[0] = intersectLineWithPlane(c, a);
        p[1] = intersectLineWithPlane(c, b);
    } else {
        p[0] = p[1] = vec3(0);
    }
    return Line(p);
}

void main() {
    Vertex v0 = projectVertex(pos0, outlinePlane);
    Vertex v1 = projectVertex(pos1, outlinePlane);
    Vertex v2 = projectVertex(pos2, outlinePlane);
    Line line = intersectTriangleWithPlane(v0, v1, v2);
    vec3 pos = line.pos[gl_VertexID];
    gl_Position = worldClipMatrix * vec4(pos, 1);
    triangleColor = color;
}
