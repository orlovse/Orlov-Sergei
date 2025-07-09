uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
varying vec4 vColor;
uniform sampler2D uPositions;
float PI = 3.141592653589793238;
void main() {
    vUv = uv;
    vec4 pos = texture2D(uPositions, uv);
    float angle = atan(pos.y, pos.x);

    float value = 0.5 + 0.45 * sin(( angle + time * 0.4));

    vColor = vec4(1., 0., 1., value);

    vec4 mvPosition = modelViewMatrix * vec4( pos.xyz, 1. );
    gl_PointSize = 2. * ( 1. / - mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}