import { Tracks, CuePoint } from "@dj-migrator/common";
import { Icon } from "@rsuite/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { Stack, Button, ButtonToolbar, IconButton } from "rsuite";

import { WebGLWaveform } from "@/main-window/components/player/webgl-waveform";
import { useLibrary, useMainStore } from "@/stores/libraryStore";

export function Player() {
  const audioElement = useRef<HTMLAudioElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioTrack = useRef<MediaElementAudioSourceNode | null>(null);
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const waveform = useRef<WebGLWaveform | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cuePoints, setCuePoints] = useState<CuePoint[]>([]);

  const selectedTrackId = useMainStore((state) => state.selectedTrackId);

  const loadTrack = useCallback(
    async (track: Tracks extends Map<string, infer Track> ? Track : never) => {
      if (!waveform.current) return;

      const data = await window.electronAPI.getWaveformData(track.absolutePath);

      if (!data) throw new Error("Failed to get waveform data");

      const { waveformData, duration: audioDuration } = data;
      const cuePoints = track.track.cuePoints;

      if (!waveformData) throw new Error("Failed to get waveform data");
      if (!audioDuration) throw new Error("Failed to get audio duration");

      waveform.current.pause();
      waveform.current.setTime(0);
      waveform.current.setAudioDuration(audioDuration);
      waveform.current.loadWaveform(waveformData);
      waveform.current.loadCuePoints(cuePoints);
      waveform.current.draw();

      if (audioElement.current) {
        audioElement.current.src = "local://" + track.absolutePath;
      }

      setIsPlaying(false);
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

      const gl = canvasElement.current.getContext("webgl2");
      if (gl) {
        waveform.current = new WebGLWaveform(gl, canvasElement.current.width);
      }
    }
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

  function handlePlayPauseToggle() {
    if (!waveform.current) return;

    if (!isPlaying) {
      audioTrack.current?.mediaElement.play();
      waveform.current.play();
    } else {
      audioTrack.current?.mediaElement.pause();
      waveform.current.pause();
    }

    setIsPlaying((isPlaying) => !isPlaying);
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
              onPointerDown={() => {
                if (audioElement.current) {
                  audioElement.current.currentTime = cuePoint.position / 1000;
                }
                if (waveform.current) {
                  waveform.current.setTime(cuePoint.position);
                  waveform.current.draw();
                }
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
