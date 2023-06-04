// Amplitude values are signed 16bit int (LE)
// whose min-max range is -32768 -> 32767
const MAX_AMPLITUDE_VALUE = 32767;
const MIN_AMPLITUDE_VALUE = -32768;

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
