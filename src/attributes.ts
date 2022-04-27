
/*
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color0;
layout(location = 3) in vec2 tex0;
layout(location = 4) in vec2 tex1;
*/

// fixed layout for mesh vertex attributes
export enum MeshResourceVertexAttributes {
    position,
    normal,
    color0,
    tex0,
    tex1,
};

export const meshAttributes = (function () {
    const n = Object.keys(MeshResourceVertexAttributes).length / 2;
    const attributes: string[] = [];
    for (let i = 0; i < n; i++) {
        attributes[i] = MeshResourceVertexAttributes[i];
    }
    return attributes as readonly string[];
}());


export function setAttributeDefaults(gl: WebGL2RenderingContext) {
    gl.vertexAttrib4f(MeshResourceVertexAttributes.position, 0, 0, 0, 1);
    gl.vertexAttrib4f(MeshResourceVertexAttributes.normal, 0, 0, 0, 0);
    gl.vertexAttrib4f(MeshResourceVertexAttributes.color0, 1, 1, 1, 1);
    gl.vertexAttrib4f(MeshResourceVertexAttributes.tex0, 0, 0, 0, 1);
    gl.vertexAttrib4f(MeshResourceVertexAttributes.tex1, 0, 0, 0, 1);
}

