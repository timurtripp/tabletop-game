#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uTextureSampler;
uniform sampler2D uDepthSampler;
uniform float uDepthSamplerRatio;

varying vec3 vView;
varying vec3 vNormal;
varying vec3 vLight;
varying vec4 vDepth;
varying vec2 vTexCoord;
varying vec3 vAmbient;
varying vec3 vDiffuse;
varying vec3 vSpecular;
varying float vShininess;

float calcShadow() {
  vec3 D = vDepth.xyz / vDepth.w * 0.5 + 0.5;
  float depthSample = texture2D(uDepthSampler, D.xy).r;
  return D.z < depthSample + 0.00005 ? 0.0 : 1.0;
}

vec3 calcDiffuseSpecular() {
  vec3 V = normalize(vView);
  vec3 N = normalize(vNormal);
  vec3 L = normalize(vLight);
  vec3 R = reflect(-L, N);
  float Id = max(dot(L, N), 0.0);
  float Is = vShininess > 0.0 ? pow(max(dot(R, V), 0.0), vShininess) : 0.0;
  return Id * vDiffuse + Is * vSpecular;
}

void main() {
  vec3 color = vAmbient;
  float shadow = calcShadow();
  if (shadow != 1.0)
    color += (1.0 - shadow) * calcDiffuseSpecular();
  gl_FragColor = vec4(color * texture2D(uTextureSampler, vTexCoord).rgb, 1.0);
}
