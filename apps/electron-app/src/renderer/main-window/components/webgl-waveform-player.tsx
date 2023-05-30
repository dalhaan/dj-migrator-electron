import { Tracks, CuePoint } from "@dj-migrator/common";
import { Icon } from "@rsuite/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { Stack, Button, ButtonToolbar, IconButton } from "rsuite";

import { useLibrary, useMainStore } from "@/stores/libraryStore";
import { formatTime } from "@/utils/formatters";

const ZOOM_SCALE = 1;

const standardVertexShader = (gl: WebGL2RenderingContext) => ({
  type: gl.VERTEX_SHADER,
  code: `
      attribute vec2 aVertexPosition;

      uniform vec2 uTransformFactor;
      uniform vec2 uScalingFactor;

      void main() {
        gl_Position = vec4((aVertexPosition + uTransformFactor) * uScalingFactor, 0.0, 1.0);
      }
    `,
});

const fixedWidthVertexShader = (gl: WebGL2RenderingContext) => ({
  type: gl.VERTEX_SHADER,
  code: `
      attribute vec2 aVertexPosition;

      uniform vec2 uTransformFactor;
      uniform vec2 uScalingFactor;

      void main() {
        gl_Position = vec4((aVertexPosition + uTransformFactor) * uScalingFactor, 0.0, 1.0);
      }
    `,
});

const standardMaterialFragmentShader = (gl: WebGL2RenderingContext) => ({
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
});

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

type Shader = {
  type: number;
  code: string;
};

function buildShaderProgram(gl: WebGL2RenderingContext, shaderInfo: Shader[]) {
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

function createArrayBuffer(gl: WebGL2RenderingContext, data: number[]) {
  const vertexArray = new Float32Array(data);

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
  gl.uniform2fv(uTransformFactor, [-translateX, 0]);
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

function drawCuePoint({
  gl,
  shaderProgram,
  vertexBuffer,
  bufferLength,
  color,
  time,
  duration,
  zoom,
}: {
  gl: WebGL2RenderingContext;
  shaderProgram: WebGLProgram;
  vertexBuffer: WebGLBuffer;
  bufferLength: number;
  color: [number, number, number, number] | undefined;
  time: number;
  duration: number;
  zoom: number;
}) {
  const currentScale: [number, number] = [zoom, 1];

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

  const translateX = timeToX(time, duration);

  gl.uniform2fv(uScalingFactor, currentScale);
  gl.uniform2fv(uTransformFactor, [-translateX, 0]);
  gl.uniform4fv(uGlobalColor, color || [0, 0, 1, 1.0]);

  // 4. call `gl.drawArrays` or `gl.drawElements`
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, bufferLength / 2);
}

function timeToX(time: number, duration: number) {
  const xRange = 2;
  const seconds = xRange / duration;

  return (time / 1000) * seconds;
}

// 'ccddee' => 204, 221, 238 => 0.8, 0.86, 0.93
function hexColorToRgb(
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

export function WebGLWaveformPlayer() {
  const audioElement = useRef<HTMLAudioElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioTrack = useRef<MediaElementAudioSourceNode | null>(null);
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const gl = useRef<WebGL2RenderingContext | null>(null);
  const standardShaderProgram = useRef<WebGLProgram | null>(null);
  const fixedWidthShaderProgram = useRef<WebGLProgram | null>(null);
  const waveformVertexBuffer = useRef<WebGLBuffer | null>(null);
  const waveformVertexBufferLength = useRef<number | null>(null);
  const playheadVertexBuffer = useRef<WebGLBuffer | null>(null);
  const cuePointVertexBuffers = useRef<
    {
      buffer: WebGLBuffer | null;
      color: [number, number, number, number] | undefined;
    }[]
  >([]);
  const zoom = useRef<number>(20);
  const time = useRef<number>(0);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(isPlayingRef.current);
  const [timeDisplay, setTimeDisplay] = useState<string>(
    formatTime(time.current / 1000)
  );
  const [cuePoints, setCuePoints] = useState<CuePoint[]>([]);
  const duration = useRef<number | undefined>();
  const animationHandle = useRef<number | undefined>();
  const animationStartTime = useRef<DOMHighResTimeStamp | undefined>();

  const selectedTrackId = useMainStore((state) => state.selectedTrackId);

  const loadTrack = useCallback(
    async (track: Tracks extends Map<string, infer Track> ? Track : never) => {
      if (!track.absolutePath || !gl.current || !canvasElement.current) return;

      const data = await window.electronAPI.getWaveformData(track.absolutePath);

      if (!data?.waveformData) return;

      // Get cue points
      const cuePoints = track.track.cuePoints;

      // reset time on load
      time.current = 0;

      const { waveformData, duration: audioDuration } = data;

      // Create buffers

      waveformVertexBuffer.current = createArrayBuffer(
        gl.current,
        waveformData
      );
      playheadVertexBuffer.current = createArrayBuffer(
        gl.current,
        [0, -1, 0, 1]
      );

      // Cue point buffers
      if (audioDuration) {
        cuePointVertexBuffers.current = [];

        for (const cuePoint of cuePoints) {
          const xPos = timeToX(cuePoint.position, audioDuration);

          const strokeWidth = 4 / canvasElement.current.width;

          const cuePointBuffer = createArrayBuffer(gl.current, [
            xPos - strokeWidth / 2,
            -1,
            xPos - strokeWidth / 2,
            1,

            xPos + strokeWidth / 2,
            -1,
            xPos + strokeWidth / 2,
            1,
          ]);

          cuePointVertexBuffers.current.push({
            buffer: cuePointBuffer,
            color: cuePoint.color ? hexColorToRgb(cuePoint.color) : undefined,
          });
        }
      }

      waveformVertexBufferLength.current = waveformData.length;
      duration.current = audioDuration;

      update();

      if (audioElement.current) {
        audioElement.current.src = "local://" + track.absolutePath;
      }

      setCuePoints(cuePoints);
    },
    []
  );

  useEffect(() => {
    if (selectedTrackId) {
      const track = useLibrary.getState().tracks.get(selectedTrackId);

      if (track) {
        loadTrack(track);
      }
    }
  }, [selectedTrackId, loadTrack]);

  useEffect(() => {
    if (canvasElement.current) {
      // Set up canvas
      const dpr = window.devicePixelRatio || 1;
      canvasElement.current.width = canvasElement.current.offsetWidth * dpr;
      canvasElement.current.height = canvasElement.current.offsetHeight * dpr;

      gl.current = canvasElement.current.getContext("webgl2");

      // Create shaders
      if (gl.current) {
        standardShaderProgram.current = buildShaderProgram(gl.current, [
          standardVertexShader(gl.current),
          standardMaterialFragmentShader(gl.current),
        ]);
        fixedWidthShaderProgram.current = buildShaderProgram(gl.current, [
          fixedWidthVertexShader(gl.current),
          standardMaterialFragmentShader(gl.current),
        ]);
      }
    }
  }, []);

  function zoomIn() {
    zoom.current++;

    update();
  }

  function zoomOut() {
    zoom.current--;
    if (zoom.current < 1) {
      zoom.current = 1;
    }

    update();
  }

  function handlePlayPauseToggle() {
    isPlayingRef.current = !isPlayingRef.current;

    if (isPlayingRef.current) {
      audioTrack.current?.mediaElement.play();
      play();
    } else {
      audioTrack.current?.mediaElement.pause();
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
      !standardShaderProgram.current ||
      !fixedWidthShaderProgram.current ||
      !waveformVertexBuffer.current ||
      !waveformVertexBufferLength.current ||
      !duration.current ||
      !playheadVertexBuffer.current
    )
      return;

    // // Set background colour
    // gl.current.clearColor(0.8, 0.9, 1.0, 1.0);
    // gl.current.clear(gl.current.COLOR_BUFFER_BIT);
    gl.current.clear(gl.current.COLOR_BUFFER_BIT);

    drawWaveform({
      gl: gl.current,
      shaderProgram: standardShaderProgram.current,
      vertexBuffer: waveformVertexBuffer.current,
      bufferLength: waveformVertexBufferLength.current,
      zoom: zoom.current * ZOOM_SCALE,
      time: time.current,
      duration: duration.current,
    });

    for (const cuePointBuffer of cuePointVertexBuffers.current) {
      if (cuePointBuffer.buffer) {
        drawCuePoint({
          gl: gl.current,
          shaderProgram: fixedWidthShaderProgram.current,
          vertexBuffer: cuePointBuffer.buffer,
          bufferLength: 8,
          color: cuePointBuffer.color,
          time: time.current,
          duration: duration.current,
          zoom: zoom.current,
        });
      }
    }

    drawPlayhead({
      gl: gl.current,
      shaderProgram: standardShaderProgram.current,
      vertexBuffer: playheadVertexBuffer.current,
      bufferLength: 4,
    });
  }

  // Audio element listeners
  useEffect(() => {
    if (audioElement.current && !audioContext.current) {
      audioContext.current = new AudioContext();
      audioTrack.current = audioContext.current.createMediaElementSource(
        audioElement.current
      );
      audioTrack.current.connect(audioContext.current.destination);
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
        style={{ width: "100%", height: 150, minHeight: 150 }}
      />
      <ButtonToolbar>
        <IconButton
          icon={<Icon as={isPlaying ? FaPause : FaPlay} />}
          appearance="ghost"
          onClick={handlePlayPauseToggle}
        />
        <Button onClick={zoomOut}>-</Button>
        <Button onClick={zoomIn}>+</Button>
        {cuePoints.map((cuePoint, index) => {
          return (
            <Button
              key={`cuepoint:${selectedTrackId}:${index}`}
              onClick={() => {
                time.current = cuePoint.position;
                if (audioElement.current) {
                  audioElement.current.currentTime = cuePoint.position / 1000;
                }
                update();
              }}
              style={
                cuePoint.color
                  ? { backgroundColor: `#${cuePoint.color}` }
                  : undefined
              }
            >
              Cue {index + 1}
            </Button>
          );
        })}
        <span>{timeDisplay}</span>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio
          ref={audioElement}
          // src="local:///Users/dallanfreemantle/Desktop/DALLANS HDD BACKUP/Big Salami (Vocals).wav"
          controls
          onLoadedData={() => {
            if (audioElement.current) {
              console.log(audioElement.current.duration);
            }
          }}
          style={{ display: "none" }}
        />
      </ButtonToolbar>
    </Stack>
  );
}
