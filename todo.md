# render engine

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

## resources

createProgram
createBuffer
createSampler
createTexture
createVertexArrayObject
createFrameBuffer

## functions

viewport(w,h)
clear(buffer, r,g,b,a)
copy(dst, src, rect?)
state
draw
read (async via storage buffer?)
query

## state

program
attributes defaults
uniforms
uniform_blocks_bindings
samplers
frameBuffer_bindings
textures
blend
cull
depth_test
dither
polygon_offset
sample_coverage
stencil_test
