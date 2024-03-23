export class SimpleMaterial {
  /**
   * Constructs a SimpleMaterial instance.
   *
   * @param { WebGLRenderingContext } gl
   * @param { GLfloat[] } ambient
   * @param { GLfloat[] } diffuse
   * @param { GLfloat[] } specular
   * @param { GLfloat } shininess
   */
  constructor(gl, ambient = [1, 1, 1], diffuse = [1, 1, 1], specular = [1, 1, 1], shininess = 0) {
    this.gl = gl;
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
    this.shininess = shininess;
  }

  /**
   * Applies the material to the scene.
   *
   * @param { import('./program').default } program
   */
  apply(program) {
    const { gl, ambient, diffuse, specular, shininess, texture } = this;
    gl.vertexAttrib3fv(program.indexOf('aMaterialAmbient'), ambient);
    gl.vertexAttrib3fv(program.indexOf('aMaterialDiffuse'), diffuse);
    gl.vertexAttrib3fv(program.indexOf('aMaterialSpecular'), specular);
    gl.vertexAttrib1f(program.indexOf('aMaterialShininess'), shininess);
  }

  /**
   * Creates a new SimpleMaterial from data.
   *
   * @param { Object } data
   * @param { WebGLRenderingContext } gl
   * @returns { SimpleMaterial }
   */
  static fromData(data, gl) {
    return new SimpleMaterial(gl, data['Ka'], data['Kd'], data['Ks'], data['Ns']);
  }
}
