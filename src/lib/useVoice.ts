"use client";

import { useCallback, useRef, useState } from "react";

export type VoiceState = "idle" | "loading" | "playing" | "error";

export function useVoice(voicePreference: string = "neutral") {
  const [state, setState] = useState<VoiceState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  const speak = useCallback(async (text: string) => {
    // Stop current playback immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (abortRef.current) abortRef.current.abort();
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }

    if (!text.trim()) return;

    setState("loading");
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voicePreference }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) { setState("error"); return; }

      // Get the audio data and play immediately
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio();
      audioRef.current = audio;

      audio.oncanplay = () => {
        if (audioRef.current === audio) {
          setState("playing");
          audio.play().catch(() => setState("error"));
        }
      };

      audio.onended = () => {
        setState("idle");
        if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
      };

      audio.onerror = () => setState("error");

      // Set src and load — audio starts buffering immediately
      audio.src = url;
      audio.load();

    } catch (e: unknown) {
      if ((e as Error)?.name === "AbortError") {
        setState("idle");
      } else {
        setState("error");
      }
    }
  }, [voicePreference]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    setState("idle");
  }, []);

  return { speak, stop, state };
}
