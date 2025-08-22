#version 300 es
precision highp float;

in vec2 vUV;
out vec4 FragColor;

uniform float uTime;
uniform vec2 uResolution;

uniform vec3 uPos;
uniform vec3 uDir;

mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

float mandelbulbSDF(vec3 p) {
    vec3 z = p;
    float dr = 1.0;
    float r = 0.0;
    const int ITERATIONS = 10;
    const float POWER = 8.0;

    for (int i = 0; i < ITERATIONS; i++) {
        r = length(z);
        if (r > 2.0) break;

        // Spherical coords
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        dr = pow(r, POWER - 1.0) * POWER * dr + 1.0;

        // Scale and rotate point
        float zr = pow(r, POWER);
        theta *= POWER;
        phi *= POWER;

        // Back to Cartesian coords
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(phi) * sin(theta),
            cos(theta)
        );
        z += p;
    }
    return 0.5 * log(r) * r / dr;
}

float sierpinskiTriangle(vec3 p) {
    vec3 z = p;
    int iterations = 10;
    float scale = 2.0;
    vec3 offset = vec3(1.0);
    
    for (int i = 0; i < iterations; i++) {
        if (z.x + z.y < 0.0) z.xy = -z.yx;
        if (z.x + z.z < 0.0) z.xz = -z.zx;
        if (z.y + z.z < 0.0) z.zy = -z.yz;

        z = z * scale - offset * (scale - 1.0);
    }
    
    float baseDist = length(z) * pow(scale, -float(iterations));
    
    // Adjust scale to make pyramid ~1 unit tall (tweak factor experimentally)
    float heightScale = 1.5;  // tweak this until height looks right
    
    return baseDist * heightScale;
}


float SceneSDF(vec3 p) {
    //return length(p) - 0.5;
    return sierpinskiTriangle(p);
}

vec3 GetNormal(vec3 p) {
	float d = SceneSDF(p);
    vec2 e = vec2(.01, 0);
    
    vec3 n = d - vec3(
    SceneSDF(p - e.xyy),
    SceneSDF(p - e.yxy),
    SceneSDF(p - e.yyx));

    return normalize(n);
}

float RayMarch(vec3 ro, vec3 rd) {
	float distOut = 0.;

    for (int i = 0; i < 1000; i++) {
    	vec3 p = ro + rd * distOut;
        float distCurr = SceneSDF(p);
        distOut += distCurr;
        if (distOut > 10000. || distCurr < 0.001) break;
    }

    return distOut;
}

void main() {
    vec2 uv = vUV;
    vec2 nuv = uv * 2.0 - vec2(1.0);
    nuv.x *= uResolution.x / uResolution.y;

    float fov = radians(60.0);
    float focalLength = 1.0 / tan(fov * 0.5);

    vec3 camDir = normalize(uDir);
    vec3 camRight = normalize(cross(camDir, vec3(0.0, 1.0, 0.0)));
    vec3 camUp = cross(camRight, camDir);

    mat3 camMat = mat3(camRight, camUp, camDir);

    vec3 ro = uPos;

    // Build ray direction in camera space with FOV adjustment and flipped z
    vec3 rayCamera = normalize(vec3(nuv.x, nuv.y, -focalLength));

    // Transform ray direction to world space
    vec3 rd = normalize(camMat * rayCamera);

    FragColor = vec4(0, 0, 0, 1);
    float dist = RayMarch(ro, rd);
    if (dist < 10000.0) {
        vec3 p = ro + rd * dist;
        FragColor = vec4(GetNormal(p) * 0.5 + 0.5, 1.0);
    }
}
