import { mat4 } from "gl-matrix";
import { BASIC_PROGRAM_NAME } from "./program";

export default class Thing {
  /**
   * A texture for this thing, if there is one.
   *
   * @type { WebGLTexture | null }
   */
  texture = null;

  /**
   * Constructs a Thing instance.
   *
   * @param { import('./asset').default } asset
   * @param { import('./material').SimpleMaterial } material
   * @param { mat4 } modelMatrix
   * @param { WebGLTexture | null | undefined } texture
   *   A texture (optional).
   */
  constructor(asset, material, modelMatrix = mat4.create(), texture) {
    this.asset = asset;
    this.material = material;
    this.modelMatrix = modelMatrix;
    if (texture)
      this.texture = texture;
  }

  draw(program) {
    const { asset, material } = this;
    if (program.name != BASIC_PROGRAM_NAME)
      material.apply(program);
    const texture = this.texture || asset.texture, gl = asset.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    asset.draw(program);
  }
}
