/**
 * @file Contains texture helper functions.
 */

/** Indicates a linear interpolation of texture pixels. */
export const TEX_INTERPOLATION_LINEAR = 0;

/** Indicates a nearest neighbor interpolation of texture pixels. */
export const TEX_INTERPOLATION_NEAREST = 1;

/**
 * Creates a 1x1 texture.
 *
 * @param { WebGL2RenderingContext } gl
 * @param { number } red
 * @param { number } green
 * @param { number } blue
 * @param { number? } alpha
 * @return { WebGLTexture }
 */
export function createEmptyTexture(gl, red, green, blue, alpha = 255) {
  const texture = gl.createTexture(), pixel = new Uint8Array([red, green, blue, alpha]);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1,  0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  return texture;
}

/**
 * Loads an image as a texture.
 *
 * The fallback will be returned initially, but replaced once the image loads.
 *
 * @param { WebGL2RenderingContext } gl
 * @param { string } url
 * @param { TEX_INTERPOLATION_LINEAR | TEX_INTERPOLATION_NEAREST } upscaleInterpolation
 * @param { WebGLTexture } fallback
 * @param { Function? } callback
 * @return { WebGLTexture }
 *   The `fallback` texture.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
 */
export function loadTextureImage(gl, url, upscaleInterpolation, fallback, callback) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, fallback);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, upscaleInterpolation === TEX_INTERPOLATION_NEAREST ? gl.NEAREST : gl.LINEAR);

    // WebGL1 has different requirements for power of 2 images
    // vs. non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    if (callback)
      callback();
  };
  image.src = url;

  return fallback;
}

/**
 * Checks if a value is a power of 2.
 *
 * @param { number } value 
 * @returns { boolean }
 */
function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

/**
 * Creates a depth texture.
 *
 * @param { WebGLRenderingContext } gl
 * @returns { WebGLTexture }
 */
export function createDepthTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

/**
 * Sizes a color texture.
 *
 * @param { WebGLRenderingContext } gl 
 * @param { WebGLTexture } texture 
 * @param { number } width 
 * @param { number } height 
 */
export function sizeColorTexture(gl, texture, width, height) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
}

/**
 * Sizes a depth texture.
 *
 * @param { WebGLRenderingContext } gl 
 * @param { WebGLTexture } texture 
 * @param { number } width 
 * @param { number } height 
 */
export function sizeDepthTexture(gl, texture, width, height) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
}
