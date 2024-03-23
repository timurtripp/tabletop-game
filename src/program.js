import { createProgram } from "./util";

export const BASIC_PROGRAM_NAME = 'basic';

export class Program {
  indexes = {};
  locations = {};

  /**
   * Constructs a Program instance.
   *
   * @param { string } name
   * @param { WebGLRenderingContext } gl
   * @param { WebGLShader } vertexShader
   * @param { WebGLShader } fragmentShader
   * @param { string[] } attribList
   * @param { string[] } uniformList
   */
  constructor(name, gl, vertexShader, fragmentShader, attribList, uniformList) {
    const program = createProgram(gl, vertexShader, fragmentShader);
    this.name = name;
    this.gl = gl;
    this.glProgram = program;
    attribList.forEach(attrib => this.indexes[attrib] = gl.getAttribLocation(program, attrib))
    uniformList.forEach(uniform => this.locations[uniform] = gl.getUniformLocation(program, uniform))
  }

  /**
   * Sets this program as the active program.
   *
   * @returns { Program }
   *   This program.
   */
  use() {
    this.gl.useProgram(this.glProgram);
    return this;
  }

  /**
   * Gets the index of a WebGL attrib.
   *
   * @param { string } name
   * @returns { number }
   */
  indexOf(name) {
    return this.indexes[name];
  }

  /**
   * Gets the location of a WebGL uniform.
   *
   * @param { string } name
   * @returns { WebGLUniformLocation }
   */
  locationOf(name) {
    return this.locations[name];
  }
}
