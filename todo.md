# render engine

## Research topics

- Investigate WEBGL_multi_draw performance
  - How much overhead is there per batch on various devices?
- Getting vertex info from textures in vertex shader
  - How is performance affected?
- Getting material info from uniform buffers (64 byte per material? max 1K materials = 64KB)
  - base color, metalness, roughness, occlusionStrength?, emissiveFactor?, textures?, uv transform?
  - How many materials does our worst case currently have? (>1024?)
- Shuffling triangles
  - Single draw call per material?
  - Single draw call per highlight?
  - Move invisible triangles away from active range (parent LODs, clipping volumes, invisible highlights, etc.)

## single draw call - multiple materials - multiple nodes

- material colors in uniform buffers or texture
- textures in texture arrays
- node object->world matrices in uniform buffer or texture
  - we only need node translation, so single vector per node -> max 4K nodes.

## instancing

- one triangle per instance
  - vbo can contain vertex index triplets and per-triangle info
    - vertex positions and normals from textures
  - can draw outlines
  - can draw hard edges

## instancing - parametric

- one triangle for planar surface
- one tetrahedron per instance for quadric and bezier surfaces
- barycentric varyings can be computed in vertex shader
  - compute 3D position from surface or store in texture?
- vbo contains per tetrahedron info (surface index,etc.)
- pixel shader projects pixel ray (pos + cam dir) onto surface (quadric/bezier)
  - computes normal etc from projected uv.
- single trim curve?
  - quadratic bezier uv curve?
  - quadric 3d curve?
- tetrahedra can be generated from uv triangulated face
  - 3 vertices from uv triangulation, 1 computed from the derivatives
  - split at inflexion points?
  - what if curvatures are in different directions?
  - extend 3 base vertices backwards from max curvature?
  - triangles that have more than two edge curves must be split.

## multidraw based rendering

- one draw call per highlight?
  - triangles are already grouped by object_id at load time (one range per object).
  - no need to render invisible groups!
  - max 256 draw calls (one for each group)
  - easier to not draw nodes outside of clipping volumes at all.
    - each node will have one multidraw batch each, which can be removed/disabled.
  - no need to use lookup textures for objectid->highight or highlight transforms
    - uniforms will do
  - easier to use static buffer allocation
    - use Draw_ID to read index offsets from uniform buffer or texture.
    - basic GC and compaction when freeing nodes?
      - limit how many bytes are compacted per frame?

## low-level gl abstraction

main goals:

- thin layer above WebGL2, but done sanely (and hopefully in a more WebGPU friendly fashion)
  - accepts shaders and generic state/buffers etc.
  - does not expose gl objects publicly.
- once done, should not change often
  - we can do test manually on local GPU PC and assume things will just continue to work.
- dom/json serialization
  - allows tests to compare the json rather than pixels
  - can replay recorded sequences for automated performance testing.

## mid-level abstraction

main goals:

- opinionated abstraction that exposes resources and functions specific to our engine
  - highly reduced complexity, but less flexible (shaders remain fixed).
  - no gl context or objects visible.
- dom/json serialization
  - transforms it into low-level json/dom
  - easier testing
  - inspectable
  - portable

## high-level abstraction

deals with scenes, views and cameras + controllers.

## new binary format

- gltf/glb?
  - draco mesh compression? ~8X compression
  - texture HW (super) compression ~4X compression (in memory)
- single attributes buffer (ranges with offset, lengths)
- 4byte align buffer in binary blob
- compact components (bytes and shorts instead of floats)
- remove object id, octant index and material index from vertices
  - use sub-meshes/ranges instead
  - make extra buffer(s) on load to fit current implementation
- 16 bit index buffer only (relative to sub-mesh/range)

goals:

- webgl2 only, cleanup, optimizing (vbo, uniform buffers, etc)
- compact vertices: reduce memory footprint, improve performance
- only draw visible triangles
- only pay for what we need: filter on load, reload when change: groups, clipping volume, etc.
- selective LOD: bias for detail per selection group to enable e.g. full/high LOD on selected object.
- static buffer allocation: no reallocations needed, no more IOS memory leaks
- single draw call for all node for each of these types of primitives: opaque. transparent, terrain, points, lines
- draw clipping outlines
- draw hard edges
- (pave the way for parametric rendering later)
