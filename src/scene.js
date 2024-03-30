import { mat3, mat4, vec2, vec3 } from 'gl-matrix';
import { RADIANS_90, degToRadians, mat4Normalize, mat4ScaleUniform, createShader, randomInt, rgb, createDepthFramebuffer, updateProjectionMatrixUniform, updateModelViewMatrixUniform, mat4MirrorY, mat4FromScaleUniform, vec2IsPointInRect, vec2CreateSquare, RADIANS_45, vec2RotAngle, vec2Nearest } from './util';
import basicVertexSource from './shader/basic.vert';
import basicFragmentSource from './shader/basic.frag';
import mainVertexSource from './shader/main.vert';
import mainFragmentSource from './shader/main.frag';
import { default as cubeData } from '../asset/cube.json';
import { default as d20Data } from '../asset/d20.json';
import { default as d12Data } from '../asset/d12.json';
import { default as d10Data } from '../asset/d10.json';
import { default as d8Data } from '../asset/d8.json';
import { default as d6Data } from '../asset/d6.json';
import { default as d4Data } from '../asset/d4.json';
import { default as tableData } from '../asset/table.json';
import { default as personTokenData } from '../asset/token-person-half.json';
import { default as dragonTokenData } from '../asset/token-dragon-half.json';
import Asset from './asset';
import { createEmptyTexture, loadTextureImage, createDepthTexture, sizeDepthTexture, sizeColorTexture, TEX_INTERPOLATION_LINEAR, TEX_INTERPOLATION_NEAREST } from './texture';
import { BASIC_PROGRAM_NAME, Program } from './program';
import Thing from './thing';
import { SimpleMaterial } from './material';
import { N_DRAGONS, N_NPCS, N_PLAYERS, PLAYER_AMBIENT_DIFFUSE, PLAYER_SPECULAR } from './config';

const { PI, cos, sin, floor } = Math;

/**
 * The main scene class for the CSCI 5229 final project.
 */
export default class Scene {
  /**
   * The dimensions of the scene canvas.
   */
  dim = {};

  /**
   * The point of view parameters.
   */
  pov = {
    scale: 30,
    th: -11.25,
    ph: 22.5
  };

  /**
   * The animation parameters.
   */
  animation = {
    startTime: Date.now(),
    currentTime: 0,
    elapsedTime: 0
  };

  /**
   * The WebGL programs.
   */
  program = {};

  /**
   * The textures to be used in the scene.
   *
   * @type { Record<string, WebGLTexture> }
   */
  texture = {};

  /**
   * The materials avalilable for the scene.
   *
   * @type { Record<string, Material> }
   */
  material = {};

  /**
   * The assets avalilable for the scene.
   *
   * @type { Record<string, Asset> }
   */
  asset = {};

  /**
   * The things to draw in the scene.
   *
   * @type { Thing[] }
   */
  things = [];

  /**
   * The position of the light.
   */
  lightPos = [0, 30, 0];

  /**
   * The position of the light relative to the view.
   */
  lightViewPos = vec3.create();

  /**
   * The active 4x4 transformation matricies being applied to the scene.
   */
  matrix = {
    model: mat4.create(),
    view: mat4.create(),
    modelView: mat4.create(),
    projection: mat4.create(),
    normal: mat4.create(),
    light: mat4.create(),
    lightView: mat4.create(),
    lightProjection: mat4.create(),
    modelLight: mat4.create()
  };


  /**
   * Orthogonal projection can be enabled for debugging purposes.
   * The lighting doesn't work right in this mode.
   */
  ortho = false;

  /**
   * Constructs a Scene instance.
   *
   * @param { HTMLCanvasElement } canvas
   *   The scene canvas element.
   * @param { number } density
   *   The client pixel density multiplier.
   */
  constructor(canvas, density, rootURL) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl');

    this.setDim(density);
    this._rigCanvas();
    this._initgl(rootURL);
    this.spawnThings();
    this.size();
    this.updateDepthTextureSize();
    this.updateLight();
    this.updateView();
    this.updateProjection();
    this.start();
  }

  /**
   * Resizes the scene.
   *
   * @param { number } density
   *   The client pixel density multiplier.
   */
  resize(density) {
    this.setDim(density);
    this.size();
    // this.updateDepthTextureSize();
    this.updateProjection();
    this.resume();
  }

  /**
   * Zooms in by the specified amount.
   *
   * @param { number } amount
   */
  zoomIn(amount) {
    const pov = this.pov;
    pov.scale = Math.max(pov.scale - amount, 1);
    this.updateView();
    this.updateProjection();
    // this.updateDepthTextureSize();
    this.resume();
  }

  /**
   * Zooms out by the specified amount.
   *
   * @param { number } amount
   */
  zoomOut(amount) {
    const pov = this.pov;
    pov.scale = Math.min(pov.scale + amount, 30);
    this.updateView();
    this.updateProjection();
    // this.updateDepthTextureSize();
    this.resume();
  }

  /**
   * Sets the dimensions.
   *
   * @param { number } density
   *   The client pixel density multiplier.
   */
  setDim(density) {
    const dim = this.dim;
    const { width, height } = this.canvas.getBoundingClientRect();
    dim.width = width;
    dim.height = height;
    dim.aspect = width / height;
    dim.density = density;
    dim.width2 = floor(width * density);
    dim.height2 = floor(height * density);
  }

  _rigCanvas() {
    const { pov, canvas } = this;
    let startX = -1, startY = -1, startTh, startPh;
    const updateViewAngle = (clientX, clientY) => {
      pov.th = (clientX - startX) * -0.5 + startTh;
      pov.ph = Math.min(Math.max((clientY - startY) * 0.5 + startPh, -15), 195);
      this.updateView();
      this.resume();
    }, cancelDrag = () => { startX = startY = -1; };
    canvas.addEventListener('mousedown', event => {
      startX = event.clientX;
      startY = event.clientY;
      startTh = pov.th;
      startPh = pov.ph
      event.preventDefault();
    });
    canvas.addEventListener('touchstart', event => {
      const touches = event.touches, touch = touches[touches.length - 1];
      startX = touch.clientX;
      startY = touch.clientY;
      startTh = pov.th;
      startPh = pov.ph
      event.preventDefault();
    });
    canvas.addEventListener('mousemove', event => {
      if (startX === -1 || startY === -1) return;
      updateViewAngle(event.clientX, event.clientY);
      event.preventDefault();
    });
    canvas.addEventListener('touchmove', event => {
      if (startX === -1 || startY === -1) return;
      const touches = event.touches, touch = touches[touches.length - 1];
      updateViewAngle(touch.clientX, touch.clientY);
      event.preventDefault();
    });
    canvas.addEventListener('mouseup', cancelDrag);
    canvas.addEventListener('mouseout', cancelDrag);
    canvas.addEventListener('touchend', cancelDrag);
    canvas.addEventListener('touchcancel', cancelDrag);
    canvas.parentElement.addEventListener('wheel', event => {
      const t = Math.max(-1, Math.min(1, -event.deltaY));
      if (t < 0) this.zoomIn(1);
      if (t > 0) this.zoomOut(1);
    });
  }

  /**
   * Performs the WebGL initialization tasks.
   */
  _initgl(rootURL) {
    const { gl, program, texture, asset, material } = this;

    const shaderAttribs = ['aVertexPosition', 'aVertexNormal', 'aVertexTexCoord'],
      shaderUniforms = ['uModelViewMatrix', 'uProjectionMatrix', 'uNormalMatrix'];

    program[BASIC_PROGRAM_NAME] = new Program(BASIC_PROGRAM_NAME, gl, createShader(gl, gl.VERTEX_SHADER, basicVertexSource), createShader(gl, gl.FRAGMENT_SHADER, basicFragmentSource),
      shaderAttribs,
      shaderUniforms.concat('uColor'));
    program['main'] = new Program('main', gl, createShader(gl, gl.VERTEX_SHADER, mainVertexSource), createShader(gl, gl.FRAGMENT_SHADER, mainFragmentSource),
      shaderAttribs.concat('aMaterialAmbient', 'aMaterialDiffuse', 'aMaterialSpecular', 'aMaterialShininess'),
      shaderUniforms.concat('uModelLightMatrix', 'uLightAmbient', 'uLightDiffuse', 'uLightSpecular', 'uLightPosition', 'uTextureSampler', 'uDepthSampler', 'uDepthSamplerRatio'));

    this.depthFramebuffer = createDepthFramebuffer(gl, this.colorTexture = createDepthTexture(gl), this.depthTexture = createDepthTexture(gl));

    const onTextureLoad = () => this.resume();

    const textureURL = rootURL + 'texture/';
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    texture.empty = createEmptyTexture(gl, 255, 255, 255);
    texture.npcToken = loadTextureImage(gl, textureURL + 'wood.jpg', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 245, 177, 107), onTextureLoad);

    material.default = new SimpleMaterial(gl);
    material.walls = new SimpleMaterial(gl, [1.5, 1.5, 1.5], [3, 3, 3], [1, 1, 1], 0);
    material.table = new SimpleMaterial(gl, [1, 1, 1], [1.25, 1.25, 1.25], [1, 1, 1], 0);
    material.battlemap = new SimpleMaterial(gl, [0.9, 0.9, 0.9], [1, 1, 1], [0.25, 0.25, 0.25], 200);
    material.npcToken = new SimpleMaterial(gl, [0.5, 0.5, 0.5], [0.75, 0.75, 0.75], [1, 1, 1], 0);

    let m = mat4.create(), m2 = mat4.create(), texCoordTransform = mat3.create();
    asset.ceiling = new Asset({ 'v': cubeData['v'], 'vn': cubeData['vn'], 'vt': cubeData['vt'], 'f': [cubeData['f'][5]] }, gl,  loadTextureImage(gl, textureURL + 'ceiling.jpg', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 201, 194, 178), onTextureLoad), mat4.fromScaling(m, [40, 30, 50]), mat3.fromScaling(texCoordTransform, [4, 4 * 1.66667]), true);
    asset.walls = new Asset({ 'v': cubeData['v'], 'vn': cubeData['vn'], 'vt': cubeData['vt'], 'f': [cubeData['f'][0], cubeData['f'][1], cubeData['f'][2], cubeData['f'][3]] }, gl,  loadTextureImage(gl, textureURL + 'walls.jpg', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 198, 198, 198), onTextureLoad), m, mat3.fromScaling(texCoordTransform, [2, 2 * 1.66667]), true);
    asset.floor = new Asset({ 'v': cubeData['v'], 'vn': cubeData['vn'], 'vt': cubeData['vt'], 'f': [cubeData['f'][4]] }, gl, loadTextureImage(gl, textureURL + 'floor.jpg', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 148, 89, 45), onTextureLoad), m, mat3.fromScaling(texCoordTransform, [4, 4 * 1.66667]), true);

    // Sets up the assets.
    asset.table = new Asset(tableData, gl, loadTextureImage(gl, textureURL + 'table-composite.jpg', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 194, 159, 121), onTextureLoad), mat4.rotateY(m, mat4ScaleUniform(mat4.fromTranslation(m, [0, -10.3, 0]), 0.1), RADIANS_90));
    asset.battlemap = new Asset({ 'v': cubeData['v'], 'vn': cubeData['vn'], 'vt': cubeData['vt'], 'f': [cubeData['f'][0]] }, gl, loadTextureImage(gl, textureURL + 'grid.gif', TEX_INTERPOLATION_NEAREST, createEmptyTexture(gl, 255, 255, 255), onTextureLoad), mat4.fromTranslation(m, [1, 0, 0]), mat3.fromScaling(texCoordTransform, [32, 32]));
    asset.d20 = new Asset(d20Data, gl, loadTextureImage(gl, textureURL + 'd20.png', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 255, 255, 255), onTextureLoad), mat4.fromScaling(m, [0.005, 0.005, 0.005]), );
    asset.d12 = new Asset(d12Data, gl, loadTextureImage(gl, textureURL + 'd12.png', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 255, 255, 255), onTextureLoad), m);
    asset.d10 = new Asset(d10Data, gl, loadTextureImage(gl, textureURL + 'd10.png', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 255, 255, 255), onTextureLoad), m);
    asset.d8 = new Asset(d8Data, gl, loadTextureImage(gl, textureURL + 'd8.png', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 255, 255, 255), onTextureLoad), m);
    asset.d6 = new Asset(d6Data, gl, loadTextureImage(gl, textureURL + 'd6.png', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 255, 255, 255), onTextureLoad), m);
    asset.d4 = new Asset(d4Data, gl, loadTextureImage(gl, textureURL + 'd4.png', TEX_INTERPOLATION_LINEAR, createEmptyTexture(gl, 255, 255, 255), onTextureLoad), m);
    asset.personToken = new Asset([personTokenData, personTokenData], gl, texture.empty, [mat4FromScaleUniform(m, 0.03), mat4MirrorY(m2, m)]);
    asset.dragonToken = new Asset([dragonTokenData, dragonTokenData], gl, texture.npcToken, [mat4FromScaleUniform(m, 0.03), mat4MirrorY(m2, m)]);
  }

  /**
   * Spawns all the things.
   */
  spawnThings() {
    const { gl, texture, asset, material } = this;
    let things = this.things ? [] : this.things;
    let m = mat4.create();

    // Spawns the room.
    things.push(new Thing(asset.ceiling, material.walls));
    things.push(new Thing(asset.walls, material.default));
    things.push(new Thing(asset.floor, material.default));

    // Spawns the table.
    things.push(new Thing(asset.table, material.table));

    // Spawns the battle map.
    const battlemapSize = 8;
    things.push(new Thing(asset.battlemap, material.battlemap, mat4.rotateZ(m, mat4ScaleUniform(mat4.fromTranslation(m, [0, -6.05, 0]), battlemapSize), -RADIANS_90)));

    const dice = [], dragonTokens = [], personTokens = [], dragonTokenThings = [], personTokenThings = [], playerMaterials = [], battlemapRect = vec2CreateSquare(battlemapSize, [0, 0]);
    const minX = -10, maxX = 10, minZ = 19, maxZ = -19;
    const personTokenY = -6.066;

    // Spawns the dragon tokens.
    for (let i = 0; i < N_DRAGONS; i++)
      dragonTokenThings.push(spawnNewToken(asset.dragonToken, material.npcToken, null, -battlemapSize + 2, battlemapSize - 2, -battlemapSize + 2, battlemapSize - 2, -5.45, dragonTokens, dragonTokens, m = mat4.create()));

    // Spawns the NPC tokens.
    for (let i = 0; i < N_NPCS; i++)
      personTokenThings.push(spawnNewToken(asset.personToken, material.npcToken, texture.npcToken, -battlemapSize + 1, battlemapSize - 1, -battlemapSize + 1, battlemapSize - 1, personTokenY, dragonTokens, personTokens, m = mat4.create()));

    // Spawns the player tokens.
    for (let i = 0; i < N_PLAYERS; i++) {
      const playerMaterial = new SimpleMaterial(gl, PLAYER_AMBIENT_DIFFUSE[i], PLAYER_AMBIENT_DIFFUSE[i], PLAYER_SPECULAR[i], 20);
      playerMaterials.push(playerMaterial);
      personTokenThings.push(spawnNewToken(asset.personToken, playerMaterial, null, -battlemapSize + 1, battlemapSize - 1, -battlemapSize + 1, battlemapSize - 1, personTokenY, dragonTokens, personTokens, m = mat4.create()));
    }

    // Spawns the dice.
    for (let i = 0; i < N_PLAYERS * 2; i++) {
      const playerMaterial = playerMaterials[i % N_PLAYERS];

      const d20 = spawnNewDie(asset.d20, playerMaterial, minX, maxX, minZ, maxZ, -5.67, dice, battlemapRect, m = mat4.create());
      mat4.rotateX(m, m, degToRadians(21));
      things.push(d20);

      const d12 = spawnNewDie(asset.d12, playerMaterial, minX, maxX, minZ, maxZ, -5.708, dice, battlemapRect, m = mat4.create());
      mat4.rotateX(m, m, degToRadians(32));
      things.push(d12);
  
      const d10 = spawnNewDie(asset.d10, playerMaterial, minX, maxX, minZ, maxZ, -5.767, dice, battlemapRect, m = mat4.create());
      mat4.rotate(m, m, degToRadians(67.8981), [0.575152, -0.291944, 0.764178]);
      things.push(d10);

      const d8 = spawnNewDie(asset.d8, playerMaterial, minX, maxX, minZ, maxZ, -5.774, dice, battlemapRect, m = mat4.create());
      mat4.rotate(m, m, degToRadians(57.0373), [0.762294, 0.247684, 0.597963]);
      things.push(d8);

      const d6 = spawnNewDie(asset.d6, playerMaterial, minX, maxX, minZ, maxZ, -5.81, dice, battlemapRect, m = mat4.create());
      things.push(d6);

      const d4 = spawnNewDie(asset.d4, playerMaterial, minX, maxX, minZ, maxZ, -5.865, dice, battlemapRect, m = mat4.create());
      mat4.rotate(m, m, degToRadians(56.4445), [0.771784, -0.243343, -0.587481]);
      things.push(d4);
    }

    if (N_DRAGONS > 0) {
      // Turns the dragon tokens to face a nearby person.
      for (let i = 0; i < N_DRAGONS; i++) {
        m = dragonTokenThings[i].modelMatrix;
        mat4.rotateY(m, m, vec2RotAngle(dragonTokens[i], vec2Nearest(dragonTokens[i], personTokens)[Math.floor(randomInt(0, 3) / 1.5)]) + RADIANS_90);
      }

      // Turns the person tokens to face a nearby dragon.
      for (let i = 0; i < personTokens.length; i++) {
        m = personTokenThings[i].modelMatrix;
        mat4.rotateY(m, m, vec2RotAngle(personTokens[i], vec2Nearest(personTokens[i], dragonTokens)[Math.floor(randomInt(0, 3) / 1.5)]) - RADIANS_90);
      }
    }

    // Ensures all spawned things are added to the scene.
    things = things.concat(dragonTokenThings);
    things = things.concat(personTokenThings);
    this.things = things;

    // Ensures the scene is re-rendered.
    this.renderDepthTexture = true;
    this.resume();
  }

  /**
   * Sets up the canvas size and viewport.
   */
  size() {
    const { canvas, dim } = this;
    const { width2, height2 } = dim;
    canvas.width = width2;
    canvas.height = height2;
  }

  /**
   * Updates the depth texture size.
   */
  updateDepthTextureSize() {
    const { gl, colorTexture, depthTexture } = this;
    const size = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 6144);
    sizeColorTexture(gl, colorTexture, size, size);
    sizeDepthTexture(gl, depthTexture, size, size);
    this.depthTextureSize = size;
    this.renderDepthTexture = true;
  }

  /**
   * Makes the specified program active in the scene.
   *
   * @param { string } programName
   */
  makeActiveProgram(programName) {
    this.activeProgram = this.program[programName].use();
  }

  /**
   * Updates the view matrix.
   */
  updateView() {
    const { pov, lightPos, lightViewPos, matrix, ortho } = this;
    const scale = pov.scale, th = degToRadians(pov.th), ph = degToRadians(pov.ph);
    const eyeX = scale * sin(th) * cos(ph);
    const eyeY = scale * sin(ph);
    const eyeZ = scale * cos(th) * cos(ph);
    if (ortho)
      mat4.rotateX(matrix.view, mat4.fromYRotation(matrix.view, th), ph);
    else mat4.lookAt(matrix.view, [eyeX, eyeY, eyeZ], [0, 0, 0], [0, cos(ph), 0]);
    vec3.transformMat4(lightViewPos, lightPos, matrix.view);
  }

  /**
   * Updates the projection matrix.
   */
  updateProjection() {
    const { dim, pov, matrix, ortho } = this;
    const fovy = PI * 0.25, aspect = dim.aspect, scale = pov.scale;
    if (ortho)
      mat4.orthoNO(matrix.projection, -aspect * scale, aspect * scale, -scale, scale, -scale, scale);
    else mat4.perspectiveNO(matrix.projection, fovy, aspect, 0.5, 100);
  }

  /**
   * Updates the normal matrix.
   */
  updateNormal() {
    const { activeProgram } = this;
    if (activeProgram.name == BASIC_PROGRAM_NAME) return; // Basic program doesn't have normals.
    const { gl, matrix } = this;
    const m = matrix.modelView, n = matrix.normal;
    mat4Normalize(n, m);
    gl.uniformMatrix4fv(activeProgram.locationOf('uNormalMatrix'), false, m);
  }

  /**
   * Updates the light matricies.
   */
  updateLight() {
    const { lightPos, matrix } = this;
    const fovy = PI * 0.5;
    mat4.lookAt(matrix.lightView, lightPos, [0, 0, 0], [0, 0, 1]);
    mat4.perspectiveNO(matrix.lightProjection, fovy, 1, 0.5, 100);
    mat4.multiply(matrix.light, matrix.lightProjection, matrix.lightView);
    this.renderDepthTexture = true;
  }

  /**
   * Starts drawing frames.
   */
  start() {
    this.paused = false;
    window.requestAnimationFrame(() => {
      this._animationFrame();
      this._render();
    });
  }

  /**
   * Resumes drawing frames.
   */
  resume() {
    if (this.paused)
      this.start();
  }

  /**
   * Pauses drawing frames.
   * 
   * This is useful to avoid wasting resources if nothing on the screen is animating.
   */
  pause() {
    this.paused = true;
  }

  /**
   * Performs any necessary actions to update the animation parameters.
   */
  _animationFrame() {
    const animation = this.animation;
    const currentTime = Date.now(), elapsedTime = currentTime - animation.startTime;
    animation.currentTime = currentTime;
    animation.elapsedTime = elapsedTime;
    this.pause();
    if (!this.paused) {
      window.requestAnimationFrame(() => {
        this._animationFrame();
        this._render();
      });
    }
  }

  _render() {
    const { gl, dim, texture, material, lightViewPos, matrix } = this;

    if (this.renderDepthTexture) {
      // First render the depth texture using the basic program,
      // then switch back to the main program and set the appropriate uniforms.
      // If the depth texture doesn't need rendering next time, the uniforms
      // will carry over unchanged.
      const { depthTexture, depthFramebuffer, depthTextureSize } = this;
      gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
      this.makeActiveProgram(BASIC_PROGRAM_NAME);
      gl.viewport(0, 0, depthTextureSize, depthTextureSize);
      updateProjectionMatrixUniform(gl, this.activeProgram, matrix.lightProjection);
      gl.uniform4f(this.activeProgram.locationOf('uColor'), 0, 0, 0, 1);
      this._draw(matrix.lightView);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.makeActiveProgram('main');
      gl.uniformMatrix4fv(this.activeProgram.locationOf('uLightMatrix'), false, matrix.light);
      gl.uniform3f(this.activeProgram.locationOf('uLightAmbient'), 0.4, 0.4, 0.4);
      gl.uniform3f(this.activeProgram.locationOf('uLightSpecular'), 1, 1, 1);
      gl.uniform3f(this.activeProgram.locationOf('uLightDiffuse'), 0.6, 0.6, 0.6);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.uniform1i(this.activeProgram.locationOf('uTextureSampler'), 0);
      gl.uniform1i(this.activeProgram.locationOf('uDepthSampler'), 1);
      gl.uniform1f(this.activeProgram.locationOf('uDepthSamplerRatio'), 1.5 / depthTextureSize);  
      this.renderDepthTexture = false;
    }

    gl.viewport(0, 0, dim.width2, dim.height2);
    updateProjectionMatrixUniform(gl, this.activeProgram, matrix.projection);
    gl.uniform3fv(this.activeProgram.locationOf('uLightPosition'), lightViewPos);

    // Resets the texture and material.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.empty);
    material.default.apply(this.activeProgram);

    // Draws the full scene.
    this._draw(matrix.view);
  }

  /**
   * Draws a new frame.
   * 
   * @param { mat4 } viewMatrix
   *   Either matrix.view for rendering the scene, or matrix.lightView for rendering the depth texture.
   */
  _draw(viewMatrix) {
    const { gl, asset, things, matrix, activeProgram } = this;
    const m = mat4.identity(matrix.model);

    // Clears the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Enables the Z buffer.
    gl.enable(gl.DEPTH_TEST);

    // Draws the things in the scene.
    things.forEach(thing => {
      mat4.multiply(m, mat4.identity(m), thing.modelMatrix);
      updateModelViewMatrixUniform(gl, activeProgram, m, viewMatrix, matrix.modelView, matrix.light, matrix.modelLight);
      this.updateNormal();
      thing.draw(activeProgram);
    });
  }
}

/**
 * Spawns a new die at a random position on the tabletop.
 *
 * @param { Asset } asset
 * @param { Material } material
 * @param { number } minX
 * @param { number } maxX
 * @param { number } minZ
 * @param { number } maxZ
 * @param { vec2[] } existingDice
 * @param { mat4 } modelMatrix
 * @returns { Thing }
 */
function spawnNewDie(asset, material, minX, maxX, minZ, maxZ, y, existingDice, battlemapRect, modelMatrix) {
  const pos = vec2.fromValues(randomInt(minX, maxX), randomInt(minZ, maxZ));
  if (vec2IsPointInRect(battlemapRect, pos))
    return spawnNewDie(asset, material, minX, maxX, minZ, maxZ, y, existingDice, battlemapRect, modelMatrix);
  for (let i = 0; i < existingDice.length; i++)
    if (vec2.equals(pos, existingDice[i]))
      return spawnNewDie(asset, material, minX, maxX, minZ, maxZ, y, existingDice, battlemapRect, modelMatrix);
  existingDice.push(pos);
  return new Thing(asset, material, mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(pos[0], y, pos[1])));
}

function spawnNewToken(asset, material, texture, minX, maxX, minZ, maxZ, y, dragonTokens, existingTokens, modelMatrix) {
  const pos = vec2.fromValues(randomInt(minX, maxX), randomInt(minZ, maxZ));
  for (let i = 0; i < dragonTokens.length; i++)
    if (vec2IsPointInRect(vec2CreateSquare(1, dragonTokens[i]), pos))
      return spawnNewToken(asset, material, texture, minX, maxX, minZ, maxZ, y, dragonTokens, existingTokens, modelMatrix);
  for (let i = 0; i < existingTokens.length; i++)
    if (vec2.equals(pos, existingTokens[i]))
      return spawnNewToken(asset, material, texture, minX, maxX, minZ, maxZ, y, dragonTokens, existingTokens, modelMatrix);
  existingTokens.push(pos);
  return new Thing(asset, material, mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(pos[0], y, pos[1])), texture);
}
