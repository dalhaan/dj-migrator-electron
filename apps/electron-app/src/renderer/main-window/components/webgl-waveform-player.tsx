import { useEffect, useRef, useState } from "react";
import { Stack, Button, ButtonToolbar } from "rsuite";

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
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const gl = useRef<WebGL2RenderingContext | null>(null);
  const shaderProgram = useRef<WebGLProgram | null>(null);
  const vertexArrayBuffer = useRef<WebGLBuffer | null>(null);
  const vertexArrayBufferLength = useRef<number | null>(null);
  const zoom = useRef<number>(1);
  const time = useRef<number>(0.5);
  const [timeDisplay, setTimeDisplay] = useState<number>(time.current);

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

    const aspectRatio =
      canvasElement.current.width / canvasElement.current.height;

    const waveformData = await window.electronAPI.getWaveformData();

    if (!waveformData) return;

    console.time("transform");
    // Transform waveformData
    const transformedData = [];
    for (let i = 0; i < waveformData.length; i++) {
      transformedData.push((i / waveformData.length) * 2 - 1);
      transformedData.push(waveformData[i] / 32767);
    }
    console.timeEnd("transform");

    const vertexBuffer = createArrayBuffer(gl.current, transformedData);

    vertexArrayBuffer.current = vertexBuffer;
    vertexArrayBufferLength.current = transformedData.length;

    if (shaderProgram.current && vertexBuffer) {
      draw({
        gl: gl.current,
        shaderProgram: shaderProgram.current,
        vertexBuffer,
        bufferLength: transformedData.length,
        aspectRatio,
        zoom: zoom.current,
        translate: [time.current, 0],
      });
    }
  }

  function zoomIn() {
    if (
      canvasElement.current &&
      gl.current &&
      shaderProgram.current &&
      vertexArrayBuffer.current &&
      vertexArrayBufferLength.current
    ) {
      const aspectRatio =
        canvasElement.current.width / canvasElement.current.height;

      zoom.current++;

      draw({
        gl: gl.current,
        shaderProgram: shaderProgram.current,
        vertexBuffer: vertexArrayBuffer.current,
        bufferLength: vertexArrayBufferLength.current,
        aspectRatio,
        zoom: zoom.current * ZOOM_SCALE,
        translate: [time.current, 0],
      });
    }
  }

  function zoomOut() {
    if (
      canvasElement.current &&
      gl.current &&
      shaderProgram.current &&
      vertexArrayBuffer.current &&
      vertexArrayBufferLength.current
    ) {
      const aspectRatio =
        canvasElement.current.width / canvasElement.current.height;

      zoom.current--;
      if (zoom.current < 1) {
        zoom.current = 1;
      }

      draw({
        gl: gl.current,
        shaderProgram: shaderProgram.current,
        vertexBuffer: vertexArrayBuffer.current,
        bufferLength: vertexArrayBufferLength.current,
        aspectRatio,
        zoom: zoom.current * ZOOM_SCALE,
        translate: [time.current, 0],
      });
    }
  }

  function jumpForward() {
    if (
      canvasElement.current &&
      gl.current &&
      shaderProgram.current &&
      vertexArrayBuffer.current &&
      vertexArrayBufferLength.current
    ) {
      const aspectRatio =
        canvasElement.current.width / canvasElement.current.height;

      time.current += 0.1;
      setTimeDisplay(time.current);

      draw({
        gl: gl.current,
        shaderProgram: shaderProgram.current,
        vertexBuffer: vertexArrayBuffer.current,
        bufferLength: vertexArrayBufferLength.current,
        aspectRatio,
        zoom: zoom.current * ZOOM_SCALE,
        translate: [-time.current, 0],
      });
    }
  }

  function jumpBack() {
    if (
      canvasElement.current &&
      gl.current &&
      shaderProgram.current &&
      vertexArrayBuffer.current &&
      vertexArrayBufferLength.current
    ) {
      const aspectRatio =
        canvasElement.current.width / canvasElement.current.height;

      time.current -= 0.1;
      setTimeDisplay(time.current);

      draw({
        gl: gl.current,
        shaderProgram: shaderProgram.current,
        vertexBuffer: vertexArrayBuffer.current,
        bufferLength: vertexArrayBufferLength.current,
        aspectRatio,
        zoom: zoom.current * ZOOM_SCALE,
        translate: [-time.current, 0],
      });
    }
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
        <Button onClick={zoomOut}>-</Button>
        <Button onClick={zoomIn}>+</Button>
        <Button onClick={jumpBack}>&lt;</Button>
        <Button onClick={jumpForward}>&gt;</Button>
        <span>{timeDisplay}</span>
      </ButtonToolbar>
    </Stack>
  );
}
