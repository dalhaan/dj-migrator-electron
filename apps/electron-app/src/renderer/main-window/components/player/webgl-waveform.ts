import { CuePoint } from "@dj-migrator/common";

import defaultFragmentShader from "./default-fragment-shader.glsl";
import defaultVertexShader from "./default-vertex-shader.glsl";
import fixedWidthVertexShader from "./fixed-width-vertex-shader.glsl";

type Programs = {
  DEFAULT_PROGRAM: WebGLProgram;
  FIXED_WIDTH_PROGRAM: WebGLProgram;
};

export class WebGLWaveform {
  gl: WebGL2RenderingContext;
  canvasWidth: number;
  programs: Programs;
  audioDuration: number | null = null;
  time = 0;
  zoom = 20;
  // Waveform
  waveformVertexBufferLength: number | null = null;
  waveformVao: WebGLVertexArrayObject | null = null;
  // Playhead
  playheadVertexBufferLength: number | null = null;
  playheadVao: WebGLVertexArrayObject | null = null;
  cuePointVaos: ({
    vao: WebGLVertexArrayObject | null;
    color: [number, number, number, number] | undefined;
  } | null)[] = [];
  animationHandle: number | null = null;
  animationPrevTime: DOMHighResTimeStamp | undefined;
  isAnimationPlaying = false;

  constructor(gl: WebGL2RenderingContext, canvasWidth: number) {
    this.gl = gl;
    this.canvasWidth = canvasWidth;

    this.programs = {
      DEFAULT_PROGRAM: this.buildShaderProgram(
        defaultVertexShader,
        defaultFragmentShader
      ),
      FIXED_WIDTH_PROGRAM: this.buildShaderProgram(
        fixedWidthVertexShader,
        defaultFragmentShader
      ),
    };

    // Load playhead VAO
    this.loadPlayhead();
  }

  setAudioDuration(duration: number) {
    this.audioDuration = duration;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;

    this.draw();
  }

  setTime(time: number) {
    this.time = time;
  }

  private loadPlayhead() {
    if (!this.gl)
      throw new Error("Could not load playhead. No GL2 rendering context");

    // Init playhead buffer, vao & attributes
    const vertexBuffer = this.createArrayBuffer([0, -1, 0, 1]);

    this.playheadVao = this.gl.createVertexArray();
    if (!this.playheadVao) throw new Error("Playhead VAO failed to create");
    this.gl.bindVertexArray(this.playheadVao);

    // Link `aVertexPosition` -> vertexBuffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    const aVertexPosition = this.gl.getAttribLocation(
      this.programs.DEFAULT_PROGRAM,
      "aVertexPosition"
    );
    this.gl.enableVertexAttribArray(aVertexPosition);
    this.gl.vertexAttribPointer(aVertexPosition, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
  }

  loadWaveform(data: number[]) {
    if (!this.gl)
      throw new Error("Could not load waveform. No GL2 rendering context");

    const vertexBuffer = this.createArrayBuffer(data);
    this.waveformVertexBufferLength = data.length;

    this.waveformVao = this.gl.createVertexArray();
    if (!this.waveformVao) throw new Error("Waveform VAO failed to create");

    this.gl.bindVertexArray(this.waveformVao);

    // Link `aVertexPosition` -> waveformVertexBuffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    const aVertexPosition = this.gl.getAttribLocation(
      this.programs.DEFAULT_PROGRAM,
      "aVertexPosition"
    );
    this.gl.enableVertexAttribArray(aVertexPosition);
    this.gl.vertexAttribPointer(aVertexPosition, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
  }

  loadCuePoints(cuePoints: CuePoint[]) {
    if (!this.gl)
      throw new Error("Could not load cue points. No GL2 rendering context");

    if (!this.audioDuration)
      throw new Error("Could not load cue points. No audio duration.");

    for (const cuePoint of cuePoints) {
      const xPos = WebGLWaveform.timeToX(cuePoint.position, this.audioDuration);

      const dpr = window.devicePixelRatio || 1;
      const strokeWidth = (4 * dpr) / this.canvasWidth;

      const vertexBuffer = this.createArrayBuffer([
        xPos - strokeWidth / 2,
        -1,

        xPos - strokeWidth / 2,
        1,

        xPos + strokeWidth / 2,
        -1,

        xPos + strokeWidth / 2,
        1,
      ]);
      const originBuffer = this.createArrayBuffer([
        xPos,
        0,
        xPos,
        0,
        xPos,
        0,
        xPos,
        0,
      ]);

      const cuepointVao = this.gl.createVertexArray();
      if (!cuepointVao) throw new Error("Cuepoint VAO failed to create");
      this.gl.bindVertexArray(cuepointVao);

      // Link `aVertexPosition` -> cuePointBuffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
      const aVertexPosition = this.gl.getAttribLocation(
        this.programs.FIXED_WIDTH_PROGRAM,
        "aVertexPosition"
      );
      this.gl.enableVertexAttribArray(aVertexPosition);
      this.gl.vertexAttribPointer(
        aVertexPosition,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
      );

      // Link `aOriginPosition` -> originBuffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, originBuffer);
      const aOriginPosition = this.gl.getAttribLocation(
        this.programs.FIXED_WIDTH_PROGRAM,
        "aOriginPosition"
      );
      this.gl.enableVertexAttribArray(aOriginPosition);
      this.gl.vertexAttribPointer(
        aOriginPosition,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
      );

      this.gl.bindVertexArray(null);

      this.cuePointVaos.push({
        vao: cuepointVao,
        color: cuePoint.color
          ? WebGLWaveform.hexColorToRgb(cuePoint.color)
          : undefined,
      });
    }
  }

  drawWaveform() {
    if (!this.gl)
      throw new Error("Could not draw waveform. No GL2 rendering context");
    if (!this.waveformVao)
      throw new Error("Could not draw waveform. No waveform VAO");
    if (!this.audioDuration)
      throw new Error("Could not draw waveform. No audio duration");
    if (!this.waveformVertexBufferLength)
      throw new Error(
        "Could not draw waveform. No waveform vertex buffer length"
      );

    const currentScale: [number, number] = [this.zoom, 1];

    // 1. call `gl.useProgram` for the program needed to draw.

    this.gl.useProgram(this.programs.DEFAULT_PROGRAM);
    this.gl.bindVertexArray(this.waveformVao);

    // 2. setup uniforms

    const uScalingFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uScalingFactor"
    );
    const uGlobalColor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uGlobalColor"
    );
    const uTranslateFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uTranslateFactor"
    );

    const translateX = WebGLWaveform.timeToX(this.time, this.audioDuration);

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, [-translateX, 0]);
    this.gl.uniform4fv(uGlobalColor, [0.1, 0.7, 0.2, 1.0]);

    // 3. call `gl.drawArrays` or `gl.drawElements`
    this.gl.drawArrays(
      this.gl.LINE_STRIP,
      0,
      this.waveformVertexBufferLength / 2
    );

    this.gl.bindVertexArray(null);
  }

  drawPlayhead() {
    if (!this.gl)
      throw new Error("Could not draw waveform. No GL2 rendering context");
    if (!this.playheadVao)
      throw new Error("Could not draw waveform. No playhead VAO");

    const currentScale: [number, number] = [1, 1];

    // gl.clearColor(0.8, 0.9, 1.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    // const currentScale: [number, number] = [1 / aspectRatio, 1.0];

    // 1. call `gl.useProgram` for the program needed to draw.

    this.gl.useProgram(this.programs.DEFAULT_PROGRAM);
    this.gl.bindVertexArray(this.playheadVao);

    // 2. setup uniforms

    const uScalingFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uScalingFactor"
    );
    const uGlobalColor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uGlobalColor"
    );
    const uTranslateFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uTranslateFactor"
    );

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, [0, 0]);
    this.gl.uniform4fv(uGlobalColor, [1, 0, 0, 1.0]);

    // 3. call `this.gl.drawArrays` or `this.gl.drawElements`
    this.gl.drawArrays(this.gl.LINE_STRIP, 0, 2);

    this.gl.bindVertexArray(null);
  }

  drawCuePoint(
    vao: WebGLVertexArrayObject,
    color: [number, number, number, number] | undefined
  ) {
    if (!this.gl)
      throw new Error("Could not draw cue point. No GL2 rendering context");
    if (!vao) throw new Error("Could not draw cue point. No cue point VAO");
    if (!this.audioDuration)
      throw new Error("Could not draw cue point. No audio duration");

    const currentScale: [number, number] = [this.zoom, 1];

    // 1. call `gl.useProgram` for the program needed to draw.

    this.gl.useProgram(this.programs.FIXED_WIDTH_PROGRAM);
    this.gl.bindVertexArray(vao);

    // 2. setup uniforms

    const uScalingFactor = this.gl.getUniformLocation(
      this.programs.FIXED_WIDTH_PROGRAM,
      "uScalingFactor"
    );
    const uGlobalColor = this.gl.getUniformLocation(
      this.programs.FIXED_WIDTH_PROGRAM,
      "uGlobalColor"
    );
    const uTranslateFactor = this.gl.getUniformLocation(
      this.programs.FIXED_WIDTH_PROGRAM,
      "uTranslateFactor"
    );

    const translateX = WebGLWaveform.timeToX(this.time, this.audioDuration);

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, [-translateX, 0]);
    this.gl.uniform4fv(uGlobalColor, color || [0, 0, 1, 1.0]);

    // 3. call `this.gl.drawArrays` or `this.gl.drawElements`
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.gl.bindVertexArray(null);
  }

  draw() {
    if (!this.gl) throw new Error("Could not draw. No GL2 rendering context");

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.drawWaveform();

    for (const cuePointVao of this.cuePointVaos) {
      if (cuePointVao?.vao) {
        this.drawCuePoint(cuePointVao.vao, cuePointVao.color);
      }
    }

    this.drawPlayhead();
  }

  play() {
    this.isAnimationPlaying = true;
    this.animationHandle = requestAnimationFrame((t) => {
      if (!this.animationPrevTime) {
        this.animationPrevTime = t;
      }

      const elapsed = t - this.animationPrevTime;

      this.time += elapsed;

      this.draw();

      if (this.isAnimationPlaying) {
        this.animationPrevTime = t;
        this.play();
      }
    });
  }

  pause() {
    this.isAnimationPlaying = false;
    if (this.animationHandle !== null) {
      cancelAnimationFrame(this.animationHandle);
      this.animationPrevTime = undefined;
    }
  }

  // -------------------------
  // Utility methods
  // -------------------------

  compileShader(type: number, code: string) {
    if (!this.gl)
      throw new Error("Could not compile shader. No GL2 rendering context");

    const shader = this.gl.createShader(type);

    if (!shader)
      throw new Error("Could not compile shader. Failed to create shader.");

    this.gl.shaderSource(shader, code);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      throw new Error(
        `Error compiling ${
          type === this.gl.VERTEX_SHADER ? "vertex" : "fragment"
        } shader:`
      );
    }
    return shader;
  }

  buildShaderProgram(vertexShaderCode: string, fragmentShaderCode: string) {
    if (!this.gl)
      throw new Error(
        "Could not build shader program. No GL2 rendering context"
      );

    const program = this.gl.createProgram();

    if (!program)
      throw new Error(
        "Could not build shader program. Failed to create program."
      );

    const vertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      vertexShaderCode
    );
    this.gl.attachShader(program, vertexShader);
    const fragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderCode
    );
    this.gl.attachShader(program, fragmentShader);

    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error(this.gl.getProgramInfoLog(program));
      throw new Error(
        "Could not build shader program. Error linking shader program."
      );
    }

    return program;
  }

  createArrayBuffer(data: number[]) {
    if (!this.gl)
      throw new Error(
        "Could not create array buffer. No GL2 rendering context"
      );

    const vertexArray = new Float32Array(data);

    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);

    return vertexBuffer;
  }

  static timeToX(time: number, duration: number) {
    const xRange = 2;
    const seconds = xRange / duration;

    return (time / 1000) * seconds;
  }

  static hexColorToRgb(
    hexColour: string
  ): [number, number, number, number] | undefined {
    if (hexColour.length !== 6) return;

    // 'ccddee' -> 'cc' 'dd' 'ee'
    const rHex = hexColour.substring(0, 2);
    const gHex = hexColour.substring(2, 4);
    const bHex = hexColour.substring(4, 6);

    // 'cc' 'dd' 'ee' => 204 221 238
    const r = parseInt(rHex, 16);
    const g = parseInt(gHex, 16);
    const b = parseInt(bHex, 16);

    // 204 221 238 => 0.8, 0.86, 0.93;
    const rNormalised = (1 / 255) * r;
    const gNormalised = (1 / 255) * g;
    const bNormalised = (1 / 255) * b;

    return [rNormalised, gNormalised, bNormalised, 1];
  }
}
