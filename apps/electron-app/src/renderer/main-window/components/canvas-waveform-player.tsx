import { useRef } from "react";
import { Button, Stack } from "rsuite";

export function CanvasWaveformPlayer() {
  const canvasElement = useRef<HTMLCanvasElement>(null);

  async function handleLoadWaveformData() {
    const waveformData = await window.electronAPI.getWaveformData();

    if (!waveformData) return;

    console.log(waveformData);

    if (!canvasElement.current) return;

    const dpr = window.devicePixelRatio || 1;
    canvasElement.current.width = canvasElement.current.offsetWidth * dpr;
    canvasElement.current.height = canvasElement.current.offsetHeight * dpr;

    const ctx = canvasElement.current.getContext("2d");

    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.translate(0, canvasElement.current.offsetHeight / 2); // Set Y = 0 to be in the middle of the canvas

    // draw the line segments
    const width = canvasElement.current.offsetWidth / waveformData.length;
    ctx.lineWidth = 1; // how thick the line is
    ctx.strokeStyle = "#fff"; // what color our line is
    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let i = 0; i < waveformData.length; i++) {
      const x = width * i;

      // draw line segment
      ctx.lineTo(x, (waveformData[i] / 32767) * 50);
    }

    ctx.stroke();
  }

  return (
    <Stack direction="column" alignItems="stretch">
      <Button onClick={handleLoadWaveformData}>Get waveform data</Button>
      <canvas ref={canvasElement} style={{ width: "100%" }} />
    </Stack>
  );
}
