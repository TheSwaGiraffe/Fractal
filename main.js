var canvas;
var gl;
var vertexShaderSrc;
var pass1Src;
var pass2Src;
var posLoc;

const fbSize = 256;
//Setup
async function main() {
    canvas = document.getElementById('webgl');//Get Canvas
    gl = getWebGLContext(canvas);//Get Rendering Context
    const quad = new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
    ]);

    //Error catch
    if (!gl) {
        console.log("Failed to get rendering context for WebGL!");
        return;
    }
    //Set Canvas to Black
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    vertSrc = await fetch("shader.vert").then(res => res.text());//Get Vertex Shader
    pass1Src = await fetch("pass1.frag").then(res => res.text());//Get Fragment Shader
    pass2Src = await fetch("pass2.frag").then(res => res.text());//Get Fragment Shader
    //Initialize Shaders
    program1 = createProgram(gl, vertSrc, pass1Src);
    program2 = createProgram(gl, vertSrc, pass2Src);
    if (!program1 || !program2) {
        console.log("Failed to create shader programs!");
        return;
    }

    //Setup Screen Quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    //Setup Frame Buffer
    fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    //Setup & Assign Frame Buffer Tex
    fbTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fbTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbSize, fbSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); //Return to default FrameBuffer

    //Get uniform locations
    posLoc = gl.getUniformLocation(program2, "u_pos");
    scaleLoc = gl.getUniformLocation(program2, "u_scale");
    //Start draw loop
    requestAnimationFrame(draw);
}

function renderPass(program, uTime, framebuffer = null, texture = null) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    if (framebuffer) gl.viewport(0, 0, fbSize, fbSize);
    else {gl.viewport(0, 0, canvas.width, canvas.height); console.log(canvas.width, canvas.height);}
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    gl.uniform1f(timeLoc, uTime);
    if (!framebuffer) {
        gl.uniform2f(posLoc, 0, 0);
        gl.uniform1f(scaleLoc, 2);
    }

    const pL = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pL);
    gl.vertexAttribPointer(pL, 2, gl.FLOAT, false, 0, 0);

    if (texture) {
        const texLoc = gl.getUniformLocation(program, 'u_texture');
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(texLoc, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function draw(time) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    //First Pass
    renderPass(program1, time, fb)

    //Second Pass
    renderPass(program2, time, null, fbTexture);

    requestAnimationFrame(draw);
}