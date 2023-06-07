// Web Worker

import { CuePoint } from "@dj-migrator/common";

import { WebGLWaveform } from "./webgl-waveform";

let waveform: WebGLWaveform | null = null;

onmessage = async (event: MessageEvent) => {
  if (event.data.type === "INIT") {
    const { canvas } = event.data.canvas as {
      canvas: OffscreenCanvas;
    };

    const gl = canvas.getContext("webgl2");

    if (gl) {
      waveform = new WebGLWaveform(gl);
    }
  } else if (event.data.type === "LOAD_WAVEFORM_DATA") {
    const { filePath, cuePoints, bpm, duration } = event.data.data as {
      filePath: string;
      cuePoints: CuePoint[];
      bpm: number | undefined;
      duration: number;
    };

    if (waveform) {
      try {
        await waveform.loadWaveformData(filePath, cuePoints, bpm, duration);
        postMessage("LOAD_WAVEFORM_DATA_SUCCESS");
      } catch (error) {
        postMessage("LOAD_WAVEFORM_DATA_FAIL");
      }
    }
  } else if (event.data.type === "PLAY") {
    if (waveform) {
      waveform.play();
    }
  } else if (event.data.type === "PAUSE") {
    if (waveform) {
      waveform.pause();
    }
  } else if (event.data.type === "SET_TIME") {
    const currentTime = event.data.currentTime as number;

    if (waveform) {
      waveform.setTime(currentTime);
    }
  } else if (event.data.type === "SET_ZOOM") {
    const zoom = event.data.zoom as number;

    if (waveform) {
      waveform.setZoom(zoom);
    }
  } else if (event.data.type === "SET_LATENCY") {
    const latency = event.data.latency as number;

    if (waveform) {
      waveform.setLatency(latency);
    }
  } else if (event.data.type === "DRAW") {
    const accountForLatency = event.data.accountForLatency as boolean;

    if (waveform) {
      waveform.draw(accountForLatency);
    }
  }
};
