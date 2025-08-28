precision mediump float;

uniform float u_time;
varying vec2 v_uv;

float rand(float x, float seed) {
    float combined_input = x * 12.9898 + seed * 78.233;
    return fract(sin(combined_input) * 43758.5453);
}

void main() {
    gl_FragColor = vec4(v_uv, rand(u_time, + v_uv.x*456.123 + v_uv.y*123.456), 1.0);
}
