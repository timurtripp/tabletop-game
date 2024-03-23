attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexTexCoord;
attribute vec3 aMaterialAmbient;
attribute vec3 aMaterialDiffuse;
attribute vec3 aMaterialSpecular;
attribute float aMaterialShininess;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform mat4 uModelLightMatrix;
uniform vec3 uLightAmbient;
uniform vec3 uLightDiffuse;
uniform vec3 uLightSpecular;
uniform vec3 uLightPosition;

varying vec3 vView;
varying vec3 vNormal;
varying vec3 vLight;
varying vec4 vDepth;
varying vec2 vTexCoord;
varying vec3 vAmbient;
varying vec3 vDiffuse;
varying vec3 vSpecular;
varying float vShininess;

void main() {
  vec4 position = vec4(aVertexPosition, 1.0);
  vec4 worldPosition = uModelViewMatrix * position;
  vView = -worldPosition.xyz;
  vNormal = (uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz;
  vLight = uLightPosition - worldPosition.xyz;
  vDepth = uModelLightMatrix * position;
  vTexCoord = aVertexTexCoord;
  vAmbient = uLightAmbient * aMaterialAmbient;
  vDiffuse = uLightDiffuse * aMaterialDiffuse;
  vSpecular = uLightSpecular * aMaterialSpecular;
  vShininess = aMaterialShininess;
  gl_Position = uProjectionMatrix * worldPosition;
}
