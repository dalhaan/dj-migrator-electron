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
  const bpm = useRef<number | null>(null);
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
      waveform.current.setBpm(track.track.metadata.bpm ?? null);
      bpm.current = track.track.metadata.bpm ?? null;
      waveform.current.setAudioDuration(audioDuration);
      waveform.current.loadWaveform(waveformData);
      waveform.current.loadBeatgrid();
      waveform.current.loadCuePoints(cuePoints);
      waveform.current.draw(false);

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
      if (audioContext.current) {
        const latency =
          audioContext.current.baseLatency + audioContext.current.outputLatency;

        waveform.current.setLatency(latency * 1000);
      }

      audioTrack.current?.mediaElement.play();
    } else {
      audioTrack.current?.mediaElement.pause();
    }

    setIsPlaying((isPlaying) => !isPlaying);
  }

  function jumpToTime(time: number) {
    if (audioElement.current) {
      audioElement.current.currentTime = time / 1000;
    }
    if (waveform.current) {
      if (audioContext.current) {
        const latency =
          audioContext.current.baseLatency + audioContext.current.outputLatency;

        waveform.current.setLatency(latency * 1000);
      }

      waveform.current.setTime(time);
      // waveform.current.draw(waveform.current.isAnimationPlaying);
      waveform.current.draw(false);
    }
  }

  function beatJump(direction: "FORWARDS" | "BACKWARDS") {
    if (!bpm.current || !audioElement.current) return;

    console.log("beatJump", audioElement.current.currentTime);

    const noBeats = 1;
    const timePerBeatMs = (60 * 1000) / bpm.current;
    const newTime =
      direction === "FORWARDS"
        ? audioElement.current.currentTime * 1000 + timePerBeatMs
        : audioElement.current.currentTime * 1000 - timePerBeatMs;

    jumpToTime(newTime);
  }

  // Audio element listeners
  useEffect(() => {
    const audioElementRef = audioElement.current;

    function onTimeUpdate() {
      console.log("========= onTimeudpate =========");
      if (audioElementRef && waveform.current) {
        console.log("audio time: ", audioElementRef.currentTime);
        console.log("waveform time: ", waveform.current.getTime(false) / 1000);
        console.log(
          "difference: ",
          audioElementRef.currentTime - waveform.current.getTime(false) / 1000
        );
        // waveform.current.setTime(audioElementRef.currentTime * 1000);
      }
    }

    function onPlay() {
      if (audioElementRef && waveform.current) {
        waveform.current.play();
        waveform.current.setTime(audioElementRef.currentTime * 1000);
      }
    }
    function onPause() {
      if (audioElementRef && waveform.current) {
        waveform.current.pause();
        waveform.current.setTime(audioElementRef.currentTime * 1000);
      }
    }

    if (audioElementRef && !audioContext.current) {
      audioContext.current = new AudioContext();
      audioTrack.current =
        audioContext.current.createMediaElementSource(audioElementRef);
      audioTrack.current.connect(audioContext.current.destination);
    }
    audioElementRef?.addEventListener("timeupdate", onTimeUpdate);
    audioElementRef?.addEventListener("play", onPlay);
    audioElementRef?.addEventListener("pause", onPause);

    return () => {
      audioElementRef?.removeEventListener("timeupdate", onTimeUpdate);
      audioElementRef?.removeEventListener("play", onPlay);
      audioElementRef?.removeEventListener("pause", onPause);
    };
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
          onPointerDown={handlePlayPauseToggle}
        />
        <Button onClick={zoomOut}>-</Button>
        <Button onClick={zoomIn}>+</Button>
        <Button onClick={() => beatJump("BACKWARDS")}>&lt;</Button>
        <Button onClick={() => beatJump("FORWARDS")}>&gt;</Button>
        {cuePoints.map((cuePoint, index) => {
          return (
            <IconButton
              key={`cuepoint:${selectedTrackId}:${index}`}
              icon={<Icon as={FaPlay} />}
              onPointerDown={() => jumpToTime(cuePoint.position)}
              style={
                cuePoint.color
                  ? { backgroundColor: `#${cuePoint.color}` }
                  : undefined
              }
            />
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
