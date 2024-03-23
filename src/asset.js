/**
 * @typedef { { v: GLfloat[]; vn: GLfloat[]; vt: GLfloat[]; f: GLuint[][]; } } AssetData
 */

import { mat4 } from 'gl-matrix';
import { transformArray3D, toUniArray, createArrayBuffer, drawAsset, mat4Normalize, getNTriangleVerticies, transformArray2D, mat4ScaleUniform } from './util';

export default class Asset {
  /**
   * The total number of verticies that will be drawn.
   */
  nVerts = 0;

  /**
   * A texture for this asset.
   *
   * @type { WebGLTexture }
   */
  texture = null;

  /**
   * Constructs an Asset instance.
   *
   * @param { AssetData | AssetData[] } data
   *   The object data struct.
   * @param { WebGLRenderingContext } gl
   *   The WebGL context.
   * @param { WebGLTexture } texture
   *   A texture.
   * @param { mat4 | mat4[] | null | undefined } transformationMatrix
   *   A transformation matrix (optional).
   * @param { mat3 | mat3[] | null | undefined } texTransformationMatrix
   *   A texture coordinate transformation matrix (optional).
   */
  constructor(data, gl, texture, transformationMatrix, texTransformationMatrix, invertNormals = false) {
    data = data instanceof Array ? data : [data];
    let nTotalVerts = 0;
    let arrays = [];
    for (let i = 0; i < data.length; i++) {
      const assetData = data[i];
      const nVerts = getNTriangleVerticies(assetData['f']);
      let transformedPositions = assetData['v'], transformedNormals = assetData['vn'], transformedTexCoords = assetData['vt'];
      if (transformationMatrix) {
        const m = transformationMatrix instanceof Array ? transformationMatrix[i] : transformationMatrix;
        transformedPositions = transformArray3D(m, transformedPositions);
        transformedNormals = transformArray3D(mat4Normalize(mat4.create(), invertNormals ? mat4.scale(mat4.create(), m, [-1, -1, -1]): m), transformedNormals);
      }
      if (texTransformationMatrix) {
        const m = texTransformationMatrix instanceof Array ? texTransformationMatrix[i] : texTransformationMatrix;
        transformedTexCoords = transformArray2D(m, transformedTexCoords);
      }
      arrays = arrays.concat(toUniArray(transformedPositions, transformedNormals, transformedTexCoords, assetData['f'], nVerts));
      nTotalVerts += nVerts;
    }
    this.gl = gl;
    this.vbo = createArrayBuffer(gl, arrays);
    this.nVerts = nTotalVerts;
    this.texture = texture;
  }

  /**
   * Draws the asset using VBO.
   *
   * @param { import('./program').default } program
   *   The active WebGL program.
   */
  draw(program) {
    const { gl, vbo, nVerts } = this;
    drawAsset(gl, vbo, program, nVerts);
  }
}
