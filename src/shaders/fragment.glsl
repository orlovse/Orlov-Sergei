uniform float time;
uniform float progress;
varying vec2 vUv;
uniform vec3 uColor;

void main(){
  gl_FragColor = vec4(uColor, 1.0);
}