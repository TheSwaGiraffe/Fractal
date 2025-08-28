precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_pos;
uniform float u_scale;
varying vec2 v_uv;

float getDenominatorBelow(float X) {
    if (X <= 0.5) {
        return 1.0; // 2^0 = 1
    }
    float n = floor(log2(1.0 / (1.0 - X)));
    return pow(2.0, n);
}

vec2 Box(vec2 uv)
{
    uv.y/=2.;
    return fract(uv * getDenominatorBelow(uv.y))*vec2(1, 2);
}

void main() {
    vec2 UV = v_uv * u_scale + u_pos;
    if(UV.x < 0.0 || UV.x > 1.0 || UV.y < 0.0 || UV.y > 2.0)
    {
        gl_FragColor = vec4(0.75, 0.5, 0.25, 1.0);
        return;
    }
    vec4 color = texture2D(u_texture, Box(UV));
    gl_FragColor = color;
}
