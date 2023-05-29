import { useEffect, useRef, useState } from "react";
import { Stack, Button, ButtonToolbar } from "rsuite";

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
          uniform vec2 uRotationVector;

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

function draw({
  gl,
  shaderProgram,
  vertexBuffer,
  bufferLength,
  aspectRatio,
  zoom,
  translate,
}: {
  gl: WebGL2RenderingContext;
  shaderProgram: WebGLProgram;
  vertexBuffer: WebGLBuffer;
  bufferLength: number;
  aspectRatio: number;
  zoom: number;
  translate: [number, number];
}) {
  console.time("paint");

  const currentAngle = 0;

  // gl.clearColor(0.8, 0.9, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const currentScale: [number, number] = [zoom, 1.0];
  // const currentScale: [number, number] = [1 / aspectRatio, 1.0];

  const radians = (currentAngle * Math.PI) / 180.0;

  const currentRotation = [Math.sin(radians), Math.cos(radians)];

  gl.useProgram(shaderProgram);

  const uScalingFactor = gl.getUniformLocation(shaderProgram, "uScalingFactor");
  const uGlobalColor = gl.getUniformLocation(shaderProgram, "uGlobalColor");
  const uRotationVector = gl.getUniformLocation(
    shaderProgram,
    "uRotationVector"
  );
  const uTransformFactor = gl.getUniformLocation(
    shaderProgram,
    "uTransformFactor"
  );

  gl.uniform2fv(uScalingFactor, currentScale);
  gl.uniform2fv(uRotationVector, currentRotation);
  gl.uniform2fv(uTransformFactor, translate);
  gl.uniform4fv(uGlobalColor, [0.1, 0.7, 0.2, 1.0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  const aVertexPosition = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );

  gl.enableVertexAttribArray(aVertexPosition);
  gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINE_STRIP, 0, bufferLength / 2);

  // Paint playhead
  // const playheadBuffer = gl.createBuffer();
  // gl.bufferData(
  //   gl.ARRAY_BUFFER,
  //   new Float32Array([0.5, 0, 0.5, 1]),
  //   gl.STATIC_DRAW
  // );

  // gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // gl.drawArrays(gl.LINE_STRIP, 0, 2);

  console.timeEnd("paint");

  // requestAnimationFrame((currentTime) => {
  //   const deltaAngle = ((currentTime - previousTime) / 1000.0) * 90;

  //   currentAngle = (currentAngle + deltaAngle) % 360;

  //   animateScene(
  //     gl,
  //     width,
  //     height,
  //     currentScale,
  //     currentAngle,
  //     currentRotation,
  //     shaderProgram,
  //     vertexBuffer,
  //     vertexCount,
  //     vertexNumComponents,
  //     currentTime
  //   );
  // });
}

export function WebGLWaveformPlayer() {
  const audioElement = useRef<HTMLAudioElement>(null);
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const gl = useRef<WebGL2RenderingContext | null>(null);
  const shaderProgram = useRef<WebGLProgram | null>(null);
  const vertexArrayBuffer = useRef<WebGLBuffer | null>(null);
  const vertexArrayBufferLength = useRef<number | null>(null);
  const zoom = useRef<number>(1);
  const time = useRef<number>(0);
  const [timeDisplay, setTimeDisplay] = useState<string>(
    formatTime(time.current)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const duration = useRef<number | undefined>();
  const animationHandle = useRef<number | undefined>();

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
    if (!gl.current || !canvasElement.current) return;

    const data = await window.electronAPI.getWaveformData();

    if (!data?.waveformData) return;

    const { waveformData, duration: audioDuration } = data;

    const vertexBuffer = createArrayBuffer(gl.current, waveformData);

    vertexArrayBuffer.current = vertexBuffer;
    vertexArrayBufferLength.current = waveformData.length;
    duration.current = audioDuration;

    update();
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
      vertexArrayBuffer.current &&
      vertexArrayBufferLength.current
    ) {
      zoom.current--;
      if (zoom.current < 1) {
        zoom.current = 1;
      }

      update();
    }
  }

  function jumpForward() {
    time.current += 10; // jump forward 10 secs
    setTimeDisplay(formatTime(time.current));

    update();
  }

  function jumpBack() {
    time.current -= 10;
    setTimeDisplay(formatTime(time.current));

    update();
  }

  function handlePlayPauseToggle() {
    if (!isPlaying) {
      play();
    } else {
      pause();
    }

    setIsPlaying((playing) => !playing);
  }

  function play() {
    update();

    animationHandle.current = requestAnimationFrame((time) => {
      update();
    });
  }

  function pause() {
    if (animationHandle.current !== undefined) {
      cancelAnimationFrame(animationHandle.current);
    }
  }

  function update() {
    if (
      !canvasElement.current ||
      !gl.current ||
      !shaderProgram.current ||
      !vertexArrayBuffer.current ||
      !vertexArrayBufferLength.current ||
      !duration.current
    )
      return;

    const aspectRatio =
      canvasElement.current.width / canvasElement.current.height;

    const xRange = 2;
    const seconds = xRange / duration.current;
    const translateX = time.current * seconds;

    draw({
      gl: gl.current,
      shaderProgram: shaderProgram.current,
      vertexBuffer: vertexArrayBuffer.current,
      bufferLength: vertexArrayBufferLength.current,
      aspectRatio,
      zoom: zoom.current * ZOOM_SCALE,
      translate: [-translateX, 0],
    });
  }

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
