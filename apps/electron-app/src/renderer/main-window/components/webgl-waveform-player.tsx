import { useCallback, useEffect, useRef, useState } from "react";
import { Stack, Button, ButtonToolbar } from "rsuite";

import { useLibrary, useMainStore } from "@/stores/libraryStore";
import { formatTime } from "@/utils/formatters";

const ZOOM_SCALE = 1;

function compileShader(gl: WebGL2RenderingContext, type: number, code: string) {
  const shader = gl.createShader(type);

  if (!shader) return;

  gl.shaderSource(shader, code);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      `Error compiling ${
        type === gl.VERTEX_SHADER ? "vertex" : "fragment"
      } shader:`
    );
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

type ShaderInfo = {
  type: number;
  code: string;
}[];

function buildShaderProgram(
  gl: WebGL2RenderingContext,
  shaderInfo: ShaderInfo
) {
  const program = gl.createProgram();

  if (!program) return null;

  shaderInfo.forEach((desc) => {
    const shader = compileShader(gl, desc.type, desc.code);

    if (shader) {
      gl.attachShader(program, shader);
    }
  });

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log("Error linking shader program:");
    console.log(gl.getProgramInfoLog(program));
  }

  return program;
}

function createShaderProgram(gl: WebGL2RenderingContext) {
  const shaderSet: ShaderInfo = [
    {
      type: gl.VERTEX_SHADER,
      code: `
          attribute vec2 aVertexPosition;

          uniform vec2 uTransformFactor;
          uniform vec2 uScalingFactor;

          void main() {
            vec2 translatedPosition = vec2(
              aVertexPosition.x + uTransformFactor.x,
              aVertexPosition.y + uTransformFactor.y
            );

            gl_Position = vec4(translatedPosition * uScalingFactor, 0.0, 1.0);
          }
        `,
    },
    {
      type: gl.FRAGMENT_SHADER,
      code: `
        #ifdef GL_ES
          precision highp float;
        #endif

        uniform vec4 uGlobalColor;

        void main() {
          gl_FragColor = uGlobalColor;
        }
      `,
    },
  ];

  const shaderProgram = buildShaderProgram(gl, shaderSet);

  return shaderProgram;
}

function createArrayBuffer(gl: WebGL2RenderingContext, data: number[]) {
  const vertexArray = new Float32Array(data);

  console.log(vertexArray.length);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

  return vertexBuffer;
}

function drawWaveform({
  gl,
  shaderProgram,
  vertexBuffer,
  bufferLength,
  zoom,
  time,
  duration,
}: {
  gl: WebGL2RenderingContext;
  shaderProgram: WebGLProgram;
  vertexBuffer: WebGLBuffer;
  bufferLength: number;
  zoom: number;
  time: number;
  duration: number;
}) {
  const currentScale: [number, number] = [zoom, 1];

  // 1. call `gl.useProgram` for the program needed to draw.

  gl.useProgram(shaderProgram);

  // 2. setup attributes

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  const aVertexPosition = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
  gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aVertexPosition);

  // 3. setup uniforms

  const uScalingFactor = gl.getUniformLocation(shaderProgram, "uScalingFactor");
  const uGlobalColor = gl.getUniformLocation(shaderProgram, "uGlobalColor");
  const uTransformFactor = gl.getUniformLocation(
    shaderProgram,
    "uTransformFactor"
  );

  const translateX = timeToX(time, duration);

  gl.uniform2fv(uScalingFactor, currentScale);
  gl.uniform2fv(uTransformFactor, [translateX, 0]);
  gl.uniform4fv(uGlobalColor, [0.1, 0.7, 0.2, 1.0]);

  // 4. call `gl.drawArrays` or `gl.drawElements`
  gl.drawArrays(gl.LINE_STRIP, 0, bufferLength / 2);
}

function drawPlayhead({
  gl,
  shaderProgram,
  vertexBuffer,
  bufferLength,
}: {
  gl: WebGL2RenderingContext;
  shaderProgram: WebGLProgram;
  vertexBuffer: WebGLBuffer;
  bufferLength: number;
}) {
  const currentScale: [number, number] = [1, 1];

  // gl.clearColor(0.8, 0.9, 1.0, 1.0);
  // gl.clear(gl.COLOR_BUFFER_BIT);

  // const currentScale: [number, number] = [1 / aspectRatio, 1.0];

  // 1. call `gl.useProgram` for the program needed to draw.

  gl.useProgram(shaderProgram);

  // 2. setup attributes

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  const aVertexPosition = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
  gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aVertexPosition);

  // 3. setup uniforms

  const uScalingFactor = gl.getUniformLocation(shaderProgram, "uScalingFactor");
  const uGlobalColor = gl.getUniformLocation(shaderProgram, "uGlobalColor");
  const uTransformFactor = gl.getUniformLocation(
    shaderProgram,
    "uTransformFactor"
  );

  gl.uniform2fv(uScalingFactor, currentScale);
  gl.uniform2fv(uTransformFactor, [0, 0]);
  gl.uniform4fv(uGlobalColor, [1, 0, 0, 1.0]);

  // 4. call `gl.drawArrays` or `gl.drawElements`
  gl.drawArrays(gl.LINE_STRIP, 0, bufferLength / 2);
}

function timeToX(time: number, duration: number) {
  const xRange = 2;
  const seconds = xRange / duration;

  return -(time / 1000) * seconds;
}

export function WebGLWaveformPlayer() {
  const audioElement = useRef<HTMLAudioElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const track = useRef<MediaElementAudioSourceNode | null>(null);
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const gl = useRef<WebGL2RenderingContext | null>(null);
  const shaderProgram = useRef<WebGLProgram | null>(null);
  const waveformVertexBuffer = useRef<WebGLBuffer | null>(null);
  const waveformVertexBufferLength = useRef<number | null>(null);
  const playheadVertexBuffer = useRef<WebGLBuffer | null>(null);
  const zoom = useRef<number>(12);
  const time = useRef<number>(0);
  const [timeDisplay, setTimeDisplay] = useState<string>(
    formatTime(time.current / 1000)
  );
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(isPlayingRef.current);
  const duration = useRef<number | undefined>();
  const animationHandle = useRef<number | undefined>();
  const animationStartTime = useRef<DOMHighResTimeStamp | undefined>();

  const selectedTrackId = useMainStore((state) => state.selectedTrackId);
  const tracks = useLibrary((state) => state.tracks);

  const loadTrack = useCallback(async (filePath: string) => {
    if (!gl.current || !canvasElement.current) return;

    const data = await window.electronAPI.getWaveformData(filePath);

    if (!data?.waveformData) return;

    const { waveformData, duration: audioDuration } = data;

    waveformVertexBuffer.current = createArrayBuffer(gl.current, waveformData);
    playheadVertexBuffer.current = createArrayBuffer(gl.current, [0, -1, 0, 1]);

    waveformVertexBufferLength.current = waveformData.length;
    duration.current = audioDuration;

    update();
  }, []);

  useEffect(() => {
    if (selectedTrackId) {
      const filePath = tracks.get(selectedTrackId)?.absolutePath;

      if (filePath) {
        loadTrack(filePath);
      }
    }
  }, [selectedTrackId, loadTrack, tracks]);

  useEffect(() => {
    if (canvasElement.current) {
      const dpr = window.devicePixelRatio || 1;
      canvasElement.current.width = canvasElement.current.offsetWidth * dpr;
      canvasElement.current.height = canvasElement.current.offsetHeight * dpr;

      gl.current = canvasElement.current.getContext("webgl2");

      if (gl.current) {
        shaderProgram.current = createShaderProgram(gl.current);
      }
    }
  }, []);

  async function handleLoadWaveformData() {
    const filePath = await window.electronAPI.openFileDialog();

    if (!filePath) return;

    loadTrack(filePath);
  }

  function zoomIn() {
    zoom.current++;

    update();
  }

  function zoomOut() {
    if (
      canvasElement.current &&
      gl.current &&
      shaderProgram.current &&
      waveformVertexBuffer.current &&
      waveformVertexBufferLength.current
    ) {
      zoom.current--;
      if (zoom.current < 1) {
        zoom.current = 1;
      }

      update();
    }
  }

  function jumpForward() {
    time.current += 10 * 1000; // jump forward 10 secs
    setTimeDisplay(formatTime(time.current / 1000));

    update();
  }

  function jumpBack() {
    time.current -= 10 * 1000;
    setTimeDisplay(formatTime(time.current / 1000));

    update();
  }

  function handlePlayPauseToggle() {
    isPlayingRef.current = !isPlayingRef.current;

    if (isPlayingRef.current) {
      track.current?.mediaElement.play();
      play();
    } else {
      track.current?.mediaElement.pause();
      pause();
    }

    setIsPlaying((playing) => !playing);
  }

  const play = useCallback(() => {
    animationHandle.current = requestAnimationFrame((t) => {
      if (!animationStartTime.current) {
        animationStartTime.current = t;
      }

      const elapsed = t - animationStartTime.current;

      time.current += elapsed;

      update();

      if (isPlayingRef.current) {
        animationStartTime.current = t;
        play();
      }
    });
  }, []);

  const pause = useCallback(() => {
    if (animationHandle.current !== undefined) {
      cancelAnimationFrame(animationHandle.current);
      animationStartTime.current = undefined;
    }
  }, []);

  function update() {
    if (
      !canvasElement.current ||
      !gl.current ||
      !shaderProgram.current ||
      !waveformVertexBuffer.current ||
      !waveformVertexBufferLength.current ||
      !duration.current ||
      !playheadVertexBuffer.current
    )
      return;

    // // Set background colour
    // gl.current.clearColor(0.8, 0.9, 1.0, 1.0);
    // gl.current.clear(gl.current.COLOR_BUFFER_BIT);

    drawWaveform({
      gl: gl.current,
      shaderProgram: shaderProgram.current,
      vertexBuffer: waveformVertexBuffer.current,
      bufferLength: waveformVertexBufferLength.current,
      zoom: zoom.current * ZOOM_SCALE,
      time: time.current,
      duration: duration.current,
    });
    drawPlayhead({
      gl: gl.current,
      shaderProgram: shaderProgram.current,
      vertexBuffer: playheadVertexBuffer.current,
      bufferLength: 4,
    });
  }

  // Audio element listeners
  useEffect(() => {
    if (audioElement.current && !audioContext.current) {
      audioContext.current = new AudioContext();
      track.current = audioContext.current.createMediaElementSource(
        audioElement.current
      );
      track.current.connect(audioContext.current.destination);
      console.log(
        audioContext.current.baseLatency,
        audioContext.current.outputLatency
      );
    }
  }, []);

  return (
    <Stack direction="column" alignItems="stretch" spacing={10}>
      <canvas
        ref={canvasElement}
        // width="400"
        // height="400"
        style={{ width: "100%", height: 150, minHeight: 150 }}
      />
      <Button onClick={handleLoadWaveformData}>Get waveform data</Button>
      <ButtonToolbar>
        <Button onClick={handlePlayPauseToggle}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button onClick={zoomOut}>-</Button>
        <Button onClick={zoomIn}>+</Button>
        <Button onClick={jumpBack}>&lt;</Button>
        <Button onClick={jumpForward}>&gt;</Button>
        <span>{timeDisplay}</span>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio
          ref={audioElement}
          src="local:///Users/dallanfreemantle/Desktop/DALLANS HDD BACKUP/Big Salami (Vocals).wav"
          controls
          onLoadedData={() => {
            if (audioElement.current) {
              console.log(audioElement.current.duration);
            }
          }}
        />
      </ButtonToolbar>
    </Stack>
  );
}
