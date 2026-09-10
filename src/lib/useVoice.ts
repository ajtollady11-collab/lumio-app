"use client";

import { useCallback, useRef, useState } from "react";

export type VoiceState = "idle" | "loading" | "playing" | "error";

export function useVoice(voicePreference: string = "neutral") {
  const [state, setState] = useState<VoiceState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (text: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }

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

      if (!res.ok) {
        setState("error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => setState("error");

      setState("playing");
      await audio.play();

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
      audioRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setState("idle");
  }, []);

  return { speak, stop, state };
}
