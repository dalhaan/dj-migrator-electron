import { useEffect, useRef, useState } from "react";
import { Button, Stack } from "rsuite";

import { WaveformPlayer } from "./waveform-player";

export function TrackPlayer() {
  const audioElement = useRef<HTMLAudioElement>(null);
  const audioContext = useRef(new AudioContext());
  const track = useRef<MediaElementAudioSourceNode | null>(null);

  const [duration, setDuration] = useState(0);

  function handlePlayPause() {
    if (!audioElement.current) return;

    console.log(audioContext.current);

    // Check if context is in suspended state (autoplay policy)
    if (audioContext.current.state === "suspended") {
      audioContext.current.resume();
    }

    // Play or pause track depending on state
    if (audioElement.current.paused) {
      audioElement.current.play();
    } else {
      audioElement.current.pause();
    }
  }

  useEffect(() => {
    if (audioElement.current && !track.current) {
      track.current = audioContext.current.createMediaElementSource(
        audioElement.current
      );
      track.current.connect(audioContext.current.destination);

      console.log(track);
    }
  }, []);

  return (
    <div>
      <Stack direction="column" spacing={10} alignItems="stretch">
        <Button onClick={handlePlayPause}>Play</Button>

        <WaveformPlayer />

        <audio
          ref={audioElement}
          src="local:///Users/dallanfreemantle/Desktop/DALLANS HDD BACKUP/Big Salami (Vocals).wav"
          controls
          onLoadedData={() => {
            if (audioElement.current) {
              setDuration(audioElement.current.duration);
            }
          }}
        />
      </Stack>
      {/* <audio ref={audioRef} src={objectUrl || undefined} controls /> */}
    </div>
  );
}
