export function transformWaveformDataForWebGL(waveformData: number[]) {
  console.time("transformWaveformDataForWebGL");

  const transformedData = [];
  for (let i = 0; i < waveformData.length; i++) {
    transformedData.push((i / waveformData.length) * 2);
    transformedData.push(waveformData[i] / 32767);
  }

  console.timeEnd("transformWaveformDataForWebGL");

  return transformedData;
}
