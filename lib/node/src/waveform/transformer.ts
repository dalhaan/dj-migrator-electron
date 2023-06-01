const AMPLITUDE_OFFSET = 10000; // Waveform vertical padding
// Amplitude values are signed 16bit int (LE)
// whose min-max range is -32768 -> 32767
const MAX_AMPLITUDE_VALUE = 32767 + AMPLITUDE_OFFSET;
const MIN_AMPLITUDE_VALUE = -32768 - AMPLITUDE_OFFSET;

export function transformWaveformDataForWebGL(waveformData: number[]) {
  console.time("transformWaveformDataForWebGL");

  const transformedData = [];
  for (let i = 0; i < waveformData.length; i++) {
    transformedData.push((i / waveformData.length) * 2);
    transformedData.push(
      waveformData[i] > 0
        ? waveformData[i] / MAX_AMPLITUDE_VALUE
        : waveformData[i] / -MIN_AMPLITUDE_VALUE
    );
  }

  console.timeEnd("transformWaveformDataForWebGL");

  return transformedData;
}
