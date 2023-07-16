import { CuePoint } from "@dj-migrator/common";

import defaultFragmentShader from "./default-fragment-shader.glsl";
import defaultVertexShader from "./default-vertex-shader.glsl";
import fixedWidthVertexShader from "./fixed-width-vertex-shader.glsl";

type Programs = {
  DEFAULT_PROGRAM: WebGLProgram;
  FIXED_WIDTH_PROGRAM: WebGLProgram;
};
const WAVEFORM_HEIGHT = 1.5;
const WAVEFORM_PADDING = 0.3;

const MINIMAP_HEIGHT = 0.5;

export class WebGLWaveform {
  gl: WebGL2RenderingContext;
  programs: Programs;
  audioDuration: number | null = null;
  time = 0;
  bpm: number | null = null;
  latency = 0;
  zoom = 8;
  // Waveform
  waveformVertexBufferLength: number | null = null;
  waveformVao: WebGLVertexArrayObject | null = null;
  // Playhead
  playheadVertexBufferLength: number | null = null;
  playheadVao: WebGLVertexArrayObject | null = null;
  minimapPlayheadVao: WebGLVertexArrayObject | null = null;
  beatgridVertexBufferLength: number | null = null;
  beatgridVao: WebGLVertexArrayObject | null = null;
  bargridVertexBufferLength: number | null = null;
  bargridVao: WebGLVertexArrayObject | null = null;
  cuePointVaos: ({
    vao: WebGLVertexArrayObject | null;
    color: [number, number, number, number] | undefined;
  } | null)[] = [];
  animationHandle: number | null = null;
  animationPrevTime: DOMHighResTimeStamp | undefined;
  isAnimationPlaying = false;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;

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

  setBpm(bpm: number | null) {
    this.bpm = bpm;
  }

  setLatency(latency: number) {
    this.latency = latency;

    console.log("Audio output latency: " + latency);
  }

  setZoom(zoom: number) {
    this.zoom = zoom;

    this.draw(false);
  }

  setTime(time: number) {
    this.time = time;
  }

  getTime(accountForLatency: boolean) {
    return accountForLatency ? this.time - this.latency : this.time;
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

    // Clean up old waveform VAO
    this.gl.deleteVertexArray(this.waveformVao);

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

  loadBeatgrid() {
    if (!this.gl)
      throw new Error("Could not load waveform. No GL2 rendering context");

    // Clean up old beatgrid VAO
    this.gl.deleteVertexArray(this.beatgridVao);
    this.gl.deleteVertexArray(this.bargridVao);

    // If there's no bpm, we cannot know the beatgrid, therefore we cannot load the beatgrid
    if (!this.bpm || !this.audioDuration) {
      return;
    }

    // Generate beatgrid line vertices

    // Calculate number of beats in the track
    const durationMins = this.audioDuration / 60;
    const noBeats = this.bpm * durationMins;
    const timePerBeatMs = (60 * 1000) / this.bpm;

    console.log({
      bpm: this.bpm,
      durationMins,
      noBeats,
      timePerBeatMs,
    });

    const beatgridVertexData = [];
    const bargridVertexData = [];
    for (let i = 0; i < noBeats; i++) {
      const xPos = WebGLWaveform.timeToX(i * timePerBeatMs, this.audioDuration);

      // beats
      beatgridVertexData.push(xPos); // x
      beatgridVertexData.push(-1); // y
      beatgridVertexData.push(xPos); // x
      beatgridVertexData.push(1); // y

      // bars
      if (i % 4 === 0) {
        bargridVertexData.push(xPos); // x
        bargridVertexData.push(-1); // y
        bargridVertexData.push(xPos); // x
        bargridVertexData.push(1); // y
      }
    }

    const beatgridVertexBuffer = this.createArrayBuffer(beatgridVertexData);
    this.beatgridVertexBufferLength = beatgridVertexData.length;
    const bargridVertexBuffer = this.createArrayBuffer(bargridVertexData);
    this.bargridVertexBufferLength = bargridVertexData.length;

    this.beatgridVao = this.gl.createVertexArray();
    this.bargridVao = this.gl.createVertexArray();
    if (!this.beatgridVao || !this.bargridVao)
      throw new Error("Beatgrid VAO failed to create");

    this.gl.bindVertexArray(this.beatgridVao);

    // Link `aVertexPosition` -> beatgridVertexBuffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, beatgridVertexBuffer);
    let aVertexPosition = this.gl.getAttribLocation(
      this.programs.DEFAULT_PROGRAM,
      "aVertexPosition"
    );
    this.gl.enableVertexAttribArray(aVertexPosition);
    this.gl.vertexAttribPointer(aVertexPosition, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(this.bargridVao);

    // Link `aVertexPosition` -> bargridVertexBuffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bargridVertexBuffer);
    aVertexPosition = this.gl.getAttribLocation(
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

    // Clean up old cue point vaos
    for (const cuePoint of this.cuePointVaos) {
      if (cuePoint?.vao) {
        this.gl.deleteVertexArray(cuePoint.vao);
      }
    }
    this.cuePointVaos = [];

    for (const cuePoint of cuePoints) {
      const xPos = WebGLWaveform.timeToX(cuePoint.position, this.audioDuration);

      const dpr = window.devicePixelRatio || 1;
      const strokeWidth = (4 * dpr) / this.gl.canvas.width;

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
        -1,
        xPos,
        1,
        xPos,
        -1,
        xPos,
        1,
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

      let color: [number, number, number, number] | undefined;

      if (cuePoint.color) {
        color = [...cuePoint.color, 1];
      }

      this.cuePointVaos.push({
        vao: cuepointVao,
        color,
      });
    }
  }

  loadMinimapPlayhead() {
    if (!this.gl)
      throw new Error(
        "Could not load minimap playhead. No GL2 rendering context"
      );

    if (!this.audioDuration)
      throw new Error("Could not load minimap playhead. No audio duration.");

    // Clean up old minimap playhead vao
    this.gl.deleteVertexArray(this.minimapPlayheadVao);

    const dpr = window.devicePixelRatio || 1;
    const strokeWidth = (4 * dpr) / this.gl.canvas.width;

    const vertexBuffer = this.createArrayBuffer([
      -strokeWidth / 2,
      -1,

      -strokeWidth / 2,
      1,

      strokeWidth / 2,
      -1,

      strokeWidth / 2,
      1,
    ]);
    const originBuffer = this.createArrayBuffer([0, -1, 0, 1, 0, -1, 0, 1]);

    this.minimapPlayheadVao = this.gl.createVertexArray();
    if (!this.minimapPlayheadVao)
      throw new Error("Minimap playhead VAO failed to create");
    this.gl.bindVertexArray(this.minimapPlayheadVao);

    // Link `aVertexPosition` -> cuePointBuffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    const aVertexPosition = this.gl.getAttribLocation(
      this.programs.FIXED_WIDTH_PROGRAM,
      "aVertexPosition"
    );
    this.gl.enableVertexAttribArray(aVertexPosition);
    this.gl.vertexAttribPointer(aVertexPosition, 2, this.gl.FLOAT, false, 0, 0);

    // Link `aOriginPosition` -> originBuffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, originBuffer);
    const aOriginPosition = this.gl.getAttribLocation(
      this.programs.FIXED_WIDTH_PROGRAM,
      "aOriginPosition"
    );
    this.gl.enableVertexAttribArray(aOriginPosition);
    this.gl.vertexAttribPointer(aOriginPosition, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
  }

  drawWaveform(accountForLatency: boolean) {
    if (!this.gl) {
      console.error("Could not draw waveform. No GL2 rendering context");
      return;
    }
    if (!this.waveformVao) {
      console.error("Could not draw waveform. No waveform VAO");
      return;
    }
    if (!this.audioDuration) {
      console.error("Could not draw waveform. No audio duration");
      return;
    }
    if (!this.waveformVertexBufferLength) {
      console.error(
        "Could not draw waveform. No waveform vertex buffer length"
      );
      return;
    }

    const currentScale: [number, number] = [
      WebGLWaveform.zoomToScale(this.zoom),
      (WAVEFORM_HEIGHT - WAVEFORM_PADDING) / 2,
    ];

    const translateX = WebGLWaveform.timeToX(
      this.getTime(accountForLatency),
      this.audioDuration
    );
    const translateFactor: [number, number] = [-translateX, 0];
    const offsetFactor: [number, number] = [0, -MINIMAP_HEIGHT / 2];

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
    const uOffsetFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uOffsetFactor"
    );

    // Draw main waveform
    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, translateFactor);
    this.gl.uniform2fv(uOffsetFactor, offsetFactor);
    this.gl.uniform4fv(uGlobalColor, [0.1, 0.7, 0.2, 1.0]);

    // 3. call `gl.drawArrays` or `gl.drawElements`
    this.gl.drawArrays(
      this.gl.LINE_STRIP,
      0,
      this.waveformVertexBufferLength / 2
    );

    this.gl.bindVertexArray(null);
  }

  drawMinimap() {
    if (!this.gl) {
      console.error("Could not draw waveform. No GL2 rendering context");
      return;
    }
    if (!this.waveformVao)
      return console.error("Could not draw waveform. No waveform VAO");
    if (!this.audioDuration)
      return console.error("Could not draw waveform. No audio duration");
    if (!this.waveformVertexBufferLength)
      return console.error(
        "Could not draw waveform. No waveform vertex buffer length"
      );

    const currentScale: [number, number] = [1, MINIMAP_HEIGHT / 2];
    const translateFactor: [number, number] = [-1, 0];
    const offsetFactor: [number, number] = [0, 1 - MINIMAP_HEIGHT / 2];
    const color: [number, number, number, number] = [0.1, 0.7, 0.2, 1.0];

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
    const uOffsetFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uOffsetFactor"
    );

    // Draw minimap
    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, translateFactor);
    this.gl.uniform2fv(uOffsetFactor, offsetFactor);
    this.gl.uniform4fv(uGlobalColor, color);

    this.gl.drawArrays(
      this.gl.LINE_STRIP,
      0,
      this.waveformVertexBufferLength / 2
    );

    this.gl.bindVertexArray(null);
  }

  drawMinimapPlayhead(accountForLatency: boolean) {
    if (!this.gl)
      return console.error(
        "Could not draw minimap playhead. No GL2 rendering context"
      );
    if (!this.minimapPlayheadVao)
      return console.error("Could not draw minimap playhead. No playhead VAO");
    if (!this.audioDuration)
      return console.error(
        "Could not draw minimap playhead. No audio duration"
      );

    const currentScale: [number, number] = [1, MINIMAP_HEIGHT / 2];

    const translateX = WebGLWaveform.timeToX(
      this.getTime(accountForLatency),
      this.audioDuration
    );
    const translateFactor: [number, number] = [translateX - 1, 0];
    const offsetFactor: [number, number] = [0, 1 - MINIMAP_HEIGHT / 2];

    const color: [number, number, number, number] = [1, 0, 0, 1.0];

    // gl.clearColor(0.8, 0.9, 1.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    // const currentScale: [number, number] = [1 / aspectRatio, 1.0];

    // 1. call `gl.useProgram` for the program needed to draw.

    this.gl.useProgram(this.programs.FIXED_WIDTH_PROGRAM);
    this.gl.bindVertexArray(this.minimapPlayheadVao);

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
    const uOffsetFactor = this.gl.getUniformLocation(
      this.programs.FIXED_WIDTH_PROGRAM,
      "uOffsetFactor"
    );

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, translateFactor);
    this.gl.uniform2fv(uOffsetFactor, offsetFactor);
    this.gl.uniform4fv(uGlobalColor, color);

    // 3. call `this.gl.drawArrays` or `this.gl.drawElements`
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.gl.bindVertexArray(null);
  }

  drawBeatgrid(accountForLatency: boolean) {
    if (!this.gl)
      return console.error("Could not draw waveform. No GL2 rendering context");
    if (!this.bpm) return;
    if (!this.beatgridVao)
      return console.error("Could not draw beatgrid. No beatgrid VAO");
    if (!this.bargridVao)
      return console.error("Could not draw beatgrid. No bargrid VAO");
    if (!this.audioDuration)
      return console.error("Could not draw waveform. No audio duration");
    if (!this.beatgridVertexBufferLength)
      return console.error(
        "Could not draw beatgrid. No beatgrid vertex buffer length"
      );
    if (!this.bargridVertexBufferLength)
      return console.error(
        "Could not draw beatgrid. No beatgrid vertex buffer length"
      );

    const currentScale: [number, number] = [
      WebGLWaveform.zoomToScale(this.zoom),
      WAVEFORM_HEIGHT / 2,
    ];

    const translateX = WebGLWaveform.timeToX(
      this.getTime(accountForLatency),
      this.audioDuration
    );
    const translateFactor: [number, number] = [-translateX, 0];
    const offsetFactor: [number, number] = [0, -MINIMAP_HEIGHT / 2];

    // 1. call `gl.useProgram` for the program needed to draw.

    this.gl.useProgram(this.programs.DEFAULT_PROGRAM);

    // Draw beatgrid
    this.gl.bindVertexArray(this.beatgridVao);

    // 2. setup uniforms

    let uScalingFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uScalingFactor"
    );
    let uGlobalColor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uGlobalColor"
    );
    let uTranslateFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uTranslateFactor"
    );
    let uOffsetFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uOffsetFactor"
    );

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, translateFactor);
    this.gl.uniform2fv(uOffsetFactor, offsetFactor);
    this.gl.uniform4fv(uGlobalColor, [0.5, 0.5, 0.5, 1.0]);

    // 3. call `gl.drawArrays` or `gl.drawElements`
    this.gl.drawArrays(this.gl.LINES, 0, this.beatgridVertexBufferLength / 2);

    // Draw bargrid
    this.gl.bindVertexArray(this.bargridVao);

    // 2. setup uniforms

    uScalingFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uScalingFactor"
    );
    uGlobalColor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uGlobalColor"
    );
    uTranslateFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uTranslateFactor"
    );
    uOffsetFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uOffsetFactor"
    );

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, translateFactor);
    this.gl.uniform2fv(uOffsetFactor, offsetFactor);
    this.gl.uniform4fv(uGlobalColor, [1, 1, 1, 1.0]);

    // 3. call `gl.drawArrays` or `gl.drawElements`
    this.gl.drawArrays(this.gl.LINES, 0, this.bargridVertexBufferLength / 2);

    this.gl.bindVertexArray(null);
  }

  drawPlayhead() {
    if (!this.gl)
      return console.error("Could not draw waveform. No GL2 rendering context");
    if (!this.playheadVao)
      return console.error("Could not draw waveform. No playhead VAO");

    const currentScale: [number, number] = [1, WAVEFORM_HEIGHT / 2];
    const translateFactor: [number, number] = [0, 0];
    const offsetFactor: [number, number] = [0, -MINIMAP_HEIGHT / 2];

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
    const uOffsetFactor = this.gl.getUniformLocation(
      this.programs.DEFAULT_PROGRAM,
      "uOffsetFactor"
    );

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, translateFactor);
    this.gl.uniform2fv(uOffsetFactor, offsetFactor);
    this.gl.uniform4fv(uGlobalColor, [1, 0, 0, 1.0]);

    // 3. call `this.gl.drawArrays` or `this.gl.drawElements`
    this.gl.drawArrays(this.gl.LINE_STRIP, 0, 2);

    this.gl.bindVertexArray(null);
  }

  drawCuePoint(
    vao: WebGLVertexArrayObject,
    color: [number, number, number, number] | undefined,
    accountForLatency: boolean
  ) {
    if (!this.gl)
      return console.error(
        "Could not draw cue point. No GL2 rendering context"
      );
    if (!vao)
      return console.error("Could not draw cue point. No cue point VAO");
    if (!this.audioDuration)
      return console.error("Could not draw cue point. No audio duration");

    const currentScale: [number, number] = [
      WebGLWaveform.zoomToScale(this.zoom),
      WAVEFORM_HEIGHT / 2,
    ];

    const translateX = WebGLWaveform.timeToX(
      this.getTime(accountForLatency),
      this.audioDuration
    );
    const translateFactor: [number, number] = [-translateX, 0];
    const offsetFactor: [number, number] = [0, -MINIMAP_HEIGHT / 2];

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
    const uOffsetFactor = this.gl.getUniformLocation(
      this.programs.FIXED_WIDTH_PROGRAM,
      "uOffsetFactor"
    );

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, translateFactor);
    this.gl.uniform2fv(uOffsetFactor, offsetFactor);
    this.gl.uniform4fv(uGlobalColor, color || [0, 0, 1, 1.0]);

    // 3. call `this.gl.drawArrays` or `this.gl.drawElements`
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.gl.bindVertexArray(null);
  }

  drawMinimapCuePoint(
    vao: WebGLVertexArrayObject,
    color: [number, number, number, number] | undefined
  ) {
    if (!this.gl)
      return console.error(
        "Could not draw cue point. No GL2 rendering context"
      );
    if (!vao)
      return console.error("Could not draw cue point. No cue point VAO");
    if (!this.audioDuration)
      return console.error("Could not draw cue point. No audio duration");

    const currentScale: [number, number] = [1, MINIMAP_HEIGHT / 2];
    const translateFactor: [number, number] = [-1, 0];
    const offsetFactor: [number, number] = [0, 1 - MINIMAP_HEIGHT / 2];

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
    const uOffsetFactor = this.gl.getUniformLocation(
      this.programs.FIXED_WIDTH_PROGRAM,
      "uOffsetFactor"
    );

    this.gl.uniform2fv(uScalingFactor, currentScale);
    this.gl.uniform2fv(uTranslateFactor, translateFactor);
    this.gl.uniform2fv(uOffsetFactor, offsetFactor);
    this.gl.uniform4fv(uGlobalColor, color || [0, 0, 1, 1.0]);

    // 3. call `this.gl.drawArrays` or `this.gl.drawElements`
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.gl.bindVertexArray(null);
  }

  resizeCanvasToDisplaySize() {
    if ("clientWidth" in this.gl.canvas) {
      const width = this.gl.canvas.clientWidth * 2;
      const height = this.gl.canvas.clientHeight * 2;
      if (this.gl.canvas.width !== width || this.gl.canvas.height !== height) {
        this.gl.canvas.width = width;
        this.gl.canvas.height = height;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
      }
    }
  }

  draw(accountForLatency: boolean) {
    if (!this.gl) {
      console.error("Could not draw. No GL2 rendering context");
      return;
    }

    this.resizeCanvasToDisplaySize();
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.drawWaveform(accountForLatency);
    this.drawBeatgrid(accountForLatency);

    this.drawMinimap();

    for (const cuePointVao of this.cuePointVaos) {
      if (cuePointVao?.vao) {
        this.drawCuePoint(
          cuePointVao.vao,
          cuePointVao.color,
          accountForLatency
        );
        this.drawMinimapCuePoint(cuePointVao.vao, cuePointVao.color);
      }
    }

    this.drawMinimapPlayhead(accountForLatency);
    this.drawPlayhead();
  }

  playLoop() {
    this.isAnimationPlaying = true;
    this.animationHandle = requestAnimationFrame((t) => {
      if (!this.animationPrevTime) {
        this.animationPrevTime = t;
      }

      const elapsed = t - this.animationPrevTime;

      this.time += elapsed;

      this.draw(false);

      if (this.isAnimationPlaying) {
        this.animationPrevTime = t;
        this.playLoop();
      }
    });
  }

  play() {
    this.playLoop();
  }

  pause() {
    this.isAnimationPlaying = false;
    if (this.animationHandle !== null) {
      cancelAnimationFrame(this.animationHandle);
      this.animationPrevTime = undefined;

      // Reset latency so the playhead is on the current spot
      // requestAnimationFrame(() => {
      //   this.draw(false);
      // });
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
    if (hexColour.length !== 7) return;

    hexColour = hexColour.substring(1);

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

  static zoomToScale(zoom: number) {
    return 1.5 ** zoom;
  }
}
