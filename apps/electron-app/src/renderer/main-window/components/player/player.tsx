import { Tracks, CuePoint } from "@dj-migrator/common";
import { Icon } from "@rsuite/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { Stack, Button, ButtonToolbar, IconButton, SelectPicker } from "rsuite";

import { AudioPlayer } from "@/audio/audio-player";
import { WebGLWaveform } from "@/main-window/components/player/webgl-waveform";
import { useLibrary, useMainStore } from "@/stores/libraryStore";
import { getAudioPcmValues, getAudioFileDuration } from "@/workers/ffmpeg";
import { transformPcmToVertex } from "@/workers/pcm-data-to-vertex";
import { readFile } from "@/workers/readFile";

export function Player() {
  const audioPlayer = useRef(new AudioPlayer());
  const audioDurationRef = useRef(0);
  const bpm = useRef<number | null>(null);
  const beatsToJump = useRef(1);
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const waveform = useRef<WebGLWaveform | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(isPlaying);
  const [cuePoints, setCuePoints] = useState<CuePoint[]>([]);

  const selectedTrackId = useMainStore((state) => state.selectedTrackId);

  const loadTrack = useCallback(
    async (track: Tracks extends Map<string, infer Track> ? Track : never) => {
      console.time("readFile");
      const data = await readFile(track.absolutePath);
      console.timeEnd("readFile");

      // Load data from worker
      // File (fs) -> PCM values (ffmpeg) -> waveform vertex data
      async function loadWaveformData() {
        if (!waveform.current) return;

        console.time("getAudioPcmValues");
        const pcmValues = await getAudioPcmValues(data);
        console.timeEnd("getAudioPcmValues");
        console.time("transformPcmToVertex");
        const waveformVertexData = transformPcmToVertex(
          Array.from(pcmValues) // Read Int16Array as number[]
        );
        console.timeEnd("transformPcmToVertex");
        console.time("getAudioFileDuration");
        const audioDuration = await getAudioFileDuration(data);
        console.timeEnd("getAudioFileDuration");
        if (!pcmValues || !audioDuration)
          throw new Error("Failed to get waveform data");

        const cuePoints = track.track.cuePoints;

        if (!pcmValues) throw new Error("Failed to get waveform data");
        if (audioDuration === undefined)
          throw new Error("Failed to get audio duration");

        waveform.current.pause();
        waveform.current.setTime(0);
        waveform.current.setBpm(track.track.metadata.bpm ?? null);
        bpm.current = track.track.metadata.bpm ?? null;
        waveform.current.setAudioDuration(audioDuration);
        audioDurationRef.current = audioDuration;
        waveform.current.loadWaveform(waveformVertexData);
        waveform.current.loadBeatgrid();
        waveform.current.loadCuePoints(cuePoints);
        waveform.current.loadMinimapPlayhead();
        waveform.current.draw(false);

        setCuePoints(cuePoints);
      }

      // Load waveform data and audio buffer in parallel
      audioPlayer.current.loadAudioData(track.absolutePath);
      console.time("loadWaveformData");
      await loadWaveformData();
      console.timeEnd("loadWaveformData");

      setIsPlaying(false);
      isPlayingRef.current = false;
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
    const audioPlayerRef = audioPlayer.current;

    if (canvasElement.current) {
      // Set up canvas
      const dpr = window.devicePixelRatio || 1;
      canvasElement.current.width = canvasElement.current.offsetWidth * dpr;
      canvasElement.current.height = canvasElement.current.offsetHeight * dpr;

      const gl = canvasElement.current.getContext("webgl2");

      if (gl) {
        waveform.current = new WebGLWaveform(gl);

        audioPlayerRef.onPlay(() => {
          if (waveform.current) {
            waveform.current.play();
            waveform.current.setTime(audioPlayerRef.currentTime);
          }
        });
        audioPlayerRef.onPause(() => {
          if (waveform.current) {
            waveform.current.pause();
            waveform.current.setTime(audioPlayerRef.currentTime);
          }
        });
      }
    }

    return () => {
      audioPlayerRef.cleanUp();
    };
  }, []);

  function zoomIn() {
    if (waveform.current) {
      waveform.current.setZoom(waveform.current.zoom + 1);
    }
  }

  function zoomOut() {
    if (!waveform.current) return;

    if (waveform.current.zoom - 1 < 1) {
      waveform.current.setZoom(1);
    } else {
      waveform.current.setZoom(waveform.current.zoom - 1);
    }
  }

  async function play() {
    audioPlayer.current.play();
  }
  async function pause() {
    audioPlayer.current.pause();
  }

  const handlePlayPauseToggle = useCallback(async () => {
    if (!waveform.current) return;

    if (!isPlayingRef.current) {
      const latency =
        audioPlayer.current.context.baseLatency +
        audioPlayer.current.context.outputLatency;

      waveform.current.setLatency(latency * 1000);

      await play();
    } else {
      await pause();
    }

    setIsPlaying((isPlaying) => {
      isPlayingRef.current = !isPlaying;
      return !isPlaying;
    });
  }, []);

  function jumpToTime(time: number) {
    const clampedTime = Math.min(
      Math.max(time, 0),
      audioDurationRef.current * 1000
    );

    audioPlayer.current.setTime(clampedTime);

    if (waveform.current) {
      const latency =
        audioPlayer.current.context.baseLatency +
        audioPlayer.current.context.outputLatency;

      waveform.current.setLatency(latency * 1000);
      waveform.current.setTime(clampedTime);
      // waveform.current.draw(waveform.current.isAnimationPlaying);
      waveform.current.draw(false);
    }
  }

  function beatJump(direction: "FORWARDS" | "BACKWARDS") {
    if (!bpm.current) return;
    const timePerBeatMs = (60 * 1000) / bpm.current;
    const newTime =
      direction === "FORWARDS"
        ? audioPlayer.current.currentTime + timePerBeatMs * beatsToJump.current
        : audioPlayer.current.currentTime - timePerBeatMs * beatsToJump.current;
    jumpToTime(newTime);
  }

  // Canvas resize listener
  useEffect(() => {
    const canvasElementRef = canvasElement.current;
    const waveformRef = waveform.current;

    const canvasResizeObserver = new ResizeObserver(() => {
      if (waveformRef) {
        waveformRef.draw(false);
      }
    });

    if (canvasElementRef) {
      canvasResizeObserver.observe(canvasElementRef);
    }

    return () => {
      if (canvasElementRef) {
        canvasResizeObserver.unobserve(canvasElementRef);
      }
    };
  }, []);

  // Keyboard listeners
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === "Space") {
        handlePlayPauseToggle();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [handlePlayPauseToggle]);

  return (
    <Stack direction="column" alignItems="stretch" spacing={10}>
      <canvas
        ref={canvasElement}
        style={{ width: "100%", height: 210, minHeight: 210 }}
      />
      <ButtonToolbar>
        <IconButton
          icon={<Icon as={isPlaying ? FaPause : FaPlay} />}
          appearance="ghost"
          onPointerDown={handlePlayPauseToggle}
        />
        <Button onClick={zoomOut}>-</Button>
        <Button onClick={zoomIn}>+</Button>
        <Button onPointerDown={() => beatJump("BACKWARDS")}>&lt;</Button>
        <SelectPicker
          data={[1, 2, 4, 8, 16, 32].map((e) => ({ value: e, label: e }))}
          defaultValue={1}
          onChange={(beats) => {
            beatsToJump.current = beats ?? 1;
          }}
          searchable={false}
          cleanable={false}
        ></SelectPicker>
        <Button onPointerDown={() => beatJump("FORWARDS")}>&gt;</Button>
        {cuePoints.map((cuePoint, index) => {
          return (
            <IconButton
              key={`cuepoint:${selectedTrackId}:${index}`}
              icon={<Icon as={FaPlay} />}
              onPointerDown={() => jumpToTime(cuePoint.position)}
              style={
                cuePoint.color
                  ? {
                      backgroundColor: `rgb(${cuePoint.color.join(",")})`,
                    }
                  : undefined
              }
            />
          );
        })}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        {/* <audio
          ref={audioElement}
          // src="local:///Users/dallanfreemantle/Desktop/DALLANS HDD BACKUP/Big Salami (Vocals).wav"
          controls
          onLoadedData={() => {
            if (audioElement.current) {
              console.log(audioElement.current.duration);
            }
          }}
          style={{ display: "none" }}
        /> */}
      </ButtonToolbar>
    </Stack>
  );
}
