import { vec3, quat } from 'https://cdn.skypack.dev/gl-matrix';
const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2");

const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// Request pointer lock on click
canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
});

// Listen for pointer lock change events
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        console.log('Pointer locked');
        document.addEventListener('mousemove', onMouseMove, false);
    } else {
        console.log('Pointer unlocked');
        document.removeEventListener('mousemove', onMouseMove, false);
    }
});

// Fullscreen quad
const vertices = new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
]);

const vertexShaderSrc = `#version 300 es
in vec2 aPosition;
out vec2 vUV;
void main() {
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentShaderSrc = await fetch("shader.frag").then(res => res.text());

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const posAttrib = gl.getAttribLocation(program, "aPosition");
gl.enableVertexAttribArray(posAttrib);
gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.bindVertexArray(vao);

const timeLocation = gl.getUniformLocation(program, "uTime");
const resLocation = gl.getUniformLocation(program, "uResolution");
const posLocation = gl.getUniformLocation(program, "uPos");
const dirLocation = gl.getUniformLocation(program, "uDir");

var location = vec3.fromValues(0, 0, 2);
var dir = vec3.fromValues(0, 0, 1);
const rotSpeed = Math.PI/10000;


function onMouseMove(e) {
  console.log(`${dir[0]}, ${dir[1]}, ${dir[2]}`);
  const movementX = e.movementX;
  const movementY = -e.movementY;

  const forward = dir; // Already normalized initially
  const up = [0, 1, 0];
  const right = vec3.create();
  vec3.cross(right, forward, up);
  vec3.normalize(right, right);

  // Yaw (left/right) - rotate around world up
  const yaw = movementX * rotSpeed;
  const yawQuat = quat.create();
  quat.setAxisAngle(yawQuat, up, yaw);
  vec3.transformQuat(forward, forward, yawQuat);

  // Recalculate right after yaw
  vec3.cross(right, forward, up);
  vec3.normalize(right, right);

  // Pitch (up/down) - rotate around right
  const pitch = -movementY * rotSpeed;
  const pitchQuat = quat.create();
  quat.setAxisAngle(pitchQuat, right, pitch);
  vec3.transformQuat(forward, forward, pitchQuat);

  // Normalize and update dir in-place
  vec3.normalize(dir, forward);
  console.log(`${dir[0]}, ${dir[1]}, ${dir[2]}`);
}

function updateMovement() {
    const up = vec3.fromValues(0, 1, 0);
    const right = vec3.create();
    vec3.cross(right, dir, up);
    vec3.normalize(right, right);

    const speed = 0.05;

    if (keys['w']) {
        vec3.scaleAndAdd(location, location, dir, -speed);
    }
    if (keys['s']) {
        vec3.scaleAndAdd(location, location, dir, speed);
    }
    if (keys['a']) {
        vec3.scaleAndAdd(location, location, right, -speed);
    }
    if (keys['d']) {
        vec3.scaleAndAdd(location, location, right, speed);
    }
}


function render(time) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    updateMovement()

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(timeLocation, time * 0.001);
    gl.uniform2f(resLocation, canvas.width, canvas.height);
    gl.uniform3f(posLocation, location[0], location[1], location[2]);
    gl.uniform3f(dirLocation, dir[0], dir[1], dir[2]);
    
    console.log(`${dir[0]}, ${dir[1]}, ${dir[2]}`);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);