precision mediump float;

uniform float u_time;
varying vec2 v_uv;

float rand(in vec2 x, in float seed) {
    vec2 p = x * seed;
    float a = dot(p, vec2(12.9898, 78.233));
    return fract(sin(a) * 43758.5453123);
}

void main() {
    gl_FragColor = vec4(rand(v_uv, 1.23 + u_time), rand(v_uv, 2.31 + u_time), rand(v_uv, 3.12 + u_time), 1.0);
}