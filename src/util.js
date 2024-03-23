import { mat4, vec2, vec3, vec4 } from 'gl-matrix';
import { BASIC_PROGRAM_NAME } from './program';

export const RADIANS_180 = Math.PI;
export const RADIANS_90 = RADIANS_180 / 2;
export const RADIANS_45 = RADIANS_90 / 2;

/**
 * Defines an array for triangulating a face.
 */
const triangleIndicies = new Array(5);

/**
 * Gets a conversion scheme for triangulating the inputed number of faces for a
 * convex polygon.
 *
 * @param { number } nVertsPerFace
 * @returns { number[] }
 */
function getTriangleIndicies(nVertsPerFace) {
  const faceIdx = nVertsPerFace - 3;
  if (triangleIndicies[faceIdx])
    return triangleIndicies[faceIdx];
  const triangleIndiciesForFace = [];
  for (let i = 1; i < nVertsPerFace - 1; i++)
    triangleIndiciesForFace.push(0, i, i + 1);
  return triangleIndicies[faceIdx] = triangleIndiciesForFace;
}

/**
 * Converts seperate arrays of positions, normals, texture coords, and indicies
 * to a single array suitable as input to `createArrayBuffer`.
 *
 * Adapted from Freeglut (fg_geometry.c) by Pawel W. Olszta and modified for
 * use with `.obj`-style data.
 *
 * @param { GLfloat[] } positions
 * @param { GLfloat[] } normals
 * @param { GLfloat[] } texCoords
 * @param { GLuint[][] } indicies
 * @returns { GLfloat[] }
 */
export function toUniArray(positions, normals, texCoords, indicies, nVerts) {
  const nIndicies = indicies.length;
  const out = new Array(nVerts);
  let outIdx = 0;
  for (let i = 0; i < nIndicies; i++) {
    const face = indicies[i], nVertsPerFace = face.length / 3;
    const sampler = getTriangleIndicies(nVertsPerFace), nTriangleVertsPerFace = sampler.length;
    for (let j = 0; j < nTriangleVertsPerFace; j++) {
      const indiciesIdx = sampler[j] * 3;
      const posIdx = (face[indiciesIdx] - 1) * 3;
      const texIdx = (face[indiciesIdx + 1] - 1) * 2;
      const normIdx = (face[indiciesIdx + 2] - 1) * 3;
      out[outIdx] = positions[posIdx];
      out[outIdx + 1] = positions[posIdx + 1];
      out[outIdx + 2] = positions[posIdx + 2];
      out[outIdx + 3] = normals[normIdx];
      out[outIdx + 4] = normals[normIdx + 1];
      out[outIdx + 5] = normals[normIdx + 2];
      out[outIdx + 6] = texCoords[texIdx];
      out[outIdx + 7] = texCoords[texIdx + 1];
      out[outIdx + 8] = texCoords[texIdx + 2];
      outIdx += 9;
    }
  }
  return out;
}

/**
 * Gets the total number of triangle verticies to draw for an object.
 *
 * @param { GLuint[][] } indicies
 * @returns { number }
 */
export function getNTriangleVerticies(indicies) {
  const nIndicies = indicies.length;
  let nTriangleVerticies = 0;
  for (let i = 0; i < nIndicies; i++) {
    const face = indicies[i], nVertsPerFace = face.length / 3;
    const sampler = getTriangleIndicies(nVertsPerFace), nTriangleVertsPerFace = sampler.length;
    nTriangleVerticies += nTriangleVertsPerFace;
  }
  return nTriangleVerticies;
}

/**
 * Performs bulk transformations on arrays of 3D vectors.
 *
 * @param { mat4 } transformationMatrix
 * @param { GLfloat[] } inArray
 * @returns { GLfloat[] }
 */
export function transformArray3D(transformationMatrix, inArray) {
  const n = inArray.length, outArray = new Array(n);
  for (let i = 0; i < n; i += 3) {
    const transformed = vec4.fromValues(inArray[i], inArray[i + 1], inArray[i + 2], 1);
    vec4.transformMat4(transformed, transformed, transformationMatrix);
    outArray[i] = transformed[0];
    outArray[i + 1] = transformed[1];
    outArray[i + 2] = transformed[2];
  }
  return outArray;
}

/**
 * Performs bulk transformations on arrays of 2D vectors.
 *
 * @param { mat3 } transformationMatrix
 * @param { GLfloat[] } inArray
 * @returns { GLfloat[] }
 */
export function transformArray2D(transformationMatrix, inArray) {
  const n = inArray.length, outArray = new Array(n);
  for (let i = 0; i < n; i += 2) {
    const transformed = vec3.fromValues(inArray[i], inArray[i + 1], 1);
    vec3.transformMat3(transformed, transformed, transformationMatrix);
    outArray[i] = transformed[0];
    outArray[i + 1] = transformed[1];
  }
  return outArray;
}

/**
 * Creates a new WebGL buffer and assigns it to `buffer`,
 * initializing it with the contents of array `bufferData`.
 *
 * @param { WebGLRenderingContext } gl
 * @param { Iterable<number> } bufferData
 * @return { WebGLBuffer }
 */
export function createArrayBuffer(gl, bufferData) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData), gl.STATIC_DRAW);
  return buffer;
}

/**
 * Draws an asset from a buffer of verticies, normals, and texture coords.
 *
 * @param { WebGLRenderingContext } gl
 * @param { WebGLBuffer } vbo
 * @param { Program } program
 * @param { GLsizei } nVerts
 */
export function drawAsset(gl, vbo, program, nVerts) {
  const aVertexPosition = program.indexOf('aVertexPosition');
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(aVertexPosition);
  gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 36, 0);
  if (program.name == BASIC_PROGRAM_NAME)
    gl.drawArrays(gl.TRIANGLES, 0, nVerts);
  else {
    const aVertexNormal = program.indexOf('aVertexNormal'), aVertexTexCoord = program.indexOf('aVertexTexCoord');
    gl.enableVertexAttribArray(aVertexNormal);
    gl.enableVertexAttribArray(aVertexTexCoord);
    gl.vertexAttribPointer(aVertexNormal, 3, gl.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(aVertexTexCoord, 3, gl.FLOAT, false, 36, 24);
    gl.drawArrays(gl.TRIANGLES, 0, nVerts);
    gl.disableVertexAttribArray(aVertexNormal);
    gl.disableVertexAttribArray(aVertexTexCoord);
  }
  gl.disableVertexAttribArray(aVertexPosition);
}

/**
 * Creates and compiles a WebGL shader.
 *
 * @param { WebGLRenderingContext } gl
 * @param { GLenum } type
 * @param { string } source
 * @return { WebGLShader }
 */
export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/**
 * Creates a WebGL program based on the vertex and fragment shaders,
 * found in `shader`.
 *
 * @param { WebGLRenderingContext } gl
 * @return { WebGLProgram }
 */
export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw 'Error linking WebGL program: ' + gl.getProgramInfoLog(program) +
      '\n\nvs info: ' + gl.getShaderInfoLog(vertexShader) +
      '\n\nfs info: ' + gl.getShaderInfoLog(fragmentShader);

  return program;
}

/**
 * Creates the depth framebuffer and texture for casting shadows.
 *
 * @param { WebGLRenderingContext } gl
 * @param { WebGLTexture } colorTexture
 * @param { WebGLTexture } depthTexture
 * @returns { WebGLFramebuffer }
 */
export function createDepthFramebuffer(gl, colorTexture, depthTexture) {
  if (!gl.getExtension('WEBGL_depth_texture'))
    console.error('WEBGL_depth_texture is not supported in this browser!');
  const frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
  return frameBuffer;
}

/**
 * Updates the projection matrix uniform.
 *
 * @param { WebGLRenderingContext } gl
 * @param { Program } program
 * @param { mat4 } projectionMatrix
 */
export function updateProjectionMatrixUniform(gl, program, projectionMatrix) {
  gl.uniformMatrix4fv(program.locationOf('uProjectionMatrix'), false, projectionMatrix);
}

/**
 * Updates the model view matrix uniform.
 *
 * @param { WebGLRenderingContext } gl
 * @param { Program } program
 * @param { mat4 } modelMatrix
 * @param { mat4 } viewMatrix
 * @param { mat4 } modelViewMatrix
 */
export function updateModelViewMatrixUniform(gl, program, modelMatrix, viewMatrix, modelViewMatrix, lightMatrix, modelLightMatrix) {
  gl.uniformMatrix4fv(program.locationOf('uModelViewMatrix'), false, mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix));
  if (program.name != BASIC_PROGRAM_NAME)
    gl.uniformMatrix4fv(program.locationOf('uModelLightMatrix'), false, mat4.multiply(modelLightMatrix, lightMatrix, modelMatrix));
}

/**
 * Converts an angle in degrees to an angle in radians.
 * @param { number } degrees
 * @returns { number } radians
 */
export function degToRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Uniformly scales matrix `m` by scalar `s`.
 *
 * @param { mat4 } m
 * @param { number } s
 * @returns { mat4 }
 *   The matrix `m`.
 */
export function mat4ScaleUniform(m, s) {
  return mat4.scale(m, m, [s, s, s]);
}

/**
 * Uniformly scales an identity matrix by scalar `s`.
 *
 * @param { mat4 } m
 * @param { number } s
 * @returns { mat4 }
 *   The matrix `m`.
 */
export function mat4FromScaleUniform(m, s) {
  return mat4.fromScaling(m, [s, s, s]);
}

/**
 * Calculates a normal matrix from a modelView matrix `m`.
 *
 * @param { mat4 } out
 * @param { mat4 } m
 * @returns { mat4 }
 */
export function mat4Normalize(out, m) {
  return mat4.transpose(out, mat4.invert(out, m), m);
}

/**
 * Mirrors along the Y axis.
 *
 * @param { mat4 } out
 * @param { mat4 } m
 * @returns { mat4 }
 */
export function mat4MirrorY(out, m) {
  return mat4.rotateY(out, mat4.scale(out, m, [1, 1, -1]), RADIANS_180);
}

/**
 * Creates a square around the specified vec2 point.
 *
 * @param { number } size
 * @param { vec2 } point
 * @returns { [vec2, vec2, vec2] }
 */
export function vec2CreateSquare(size, point) {
  const s = vec2.fromValues(size, size), a = vec2.sub(vec2.create(), point, s), b = vec2.add(vec2.create(), point, s);
  return [a, vec2.fromValues(a[0], b[1]), b];
}

/**
 * Checks if the specified vec2 point is inside the specified rectangle.
 *
 * @param { [vec2, vec2, vec2] } rect
 * @param { vec2 } point
 * @returns { boolean }
 */
export function vec2IsPointInRect(rect, point) {
  const a = rect[0], b = rect[1], c = rect[2], m = point;
  const AB = vec2.sub(vec2.create(), a, b), AM = vec2.sub(vec2.create(), a, m), BC = vec2.sub(vec2.create(), b, c), BM = vec2.sub(vec2.create(), b, m);
  const ABAM = vec2.dot(AB, AM), ABAB = vec2.dot(AB, AB), BCBM = vec2.dot(BC, BM), BCBC = vec2.dot(BC, BC);
  return 0 <= ABAM && ABAM <= ABAB && 0 <= BCBM && BCBM <= BCBC;
}

/**
 * Gets the two nearest of the far vectors to the near vector.
 *
 * @param { vec2 } near
 * @param { vec2[] } far
 * @returns { vec2 }
 */
export function vec2Nearest(near, far) {
  let nearestVec = null, secondNearestVec = null, nearestDist;
  far.forEach(v => {
    const dist = vec2.sqrDist(near, v);
    if ((nearestVec === null || dist < nearestDist) && v != near) {
      secondNearestVec = nearestVec || v;
      nearestVec = v;
      nearestDist = dist;
    }
  });
  return [nearestVec, secondNearestVec];
}

export function vec2RotAngle(near, far) {
  const s = vec2.sub(vec2.create(), near, far);
  return -Math.atan2(s[1], s[0]);
}

/**
 * Generates a random integer between two boundaries.
 *
 * @param { number } lowerBound
 * @param { number } upperBound
 * @returns { number }
 */
export function randomInt(lowerBound, upperBound) {
  return lowerBound + Math.floor(Math.random() * (upperBound - lowerBound))
}

/**
 * Converts a color with bytes 0-255 to floats 0-1.
 *
 * @param { number } r
 * @param { number } g
 * @param { number } b
 * @returns { number[] }
 */
export function rgb(r, g, b) {
  return [r / 255, g / 255, b / 255];
}
