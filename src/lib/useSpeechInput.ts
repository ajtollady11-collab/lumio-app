"use client";

import { useCallback, useRef, useState } from "react";

export type SpeechState = "idle" | "listening" | "processing" | "error" | "unsupported";

interface UseSpeechInputOptions {
  onResult: (transcript: string) => void;
  onError?: (err: string) => void;
  lang?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

export function useSpeechInput({ onResult, onError, lang = "en-GB" }: UseSpeechInputOptions) {
  const [state, setState] = useState<SpeechState>("idle");
  const recognitionRef = useRef<AnyRecognition>(null);
  const abortedRef = useRef(false);

  const supported =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in (window as any));

  const start = useCallback(() => {
    if (!supported) { setState("unsupported"); return; }
    if (state === "listening") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    abortedRef.current = false;

    recognition.onstart = () => setState("listening");

    recognition.onresult = (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setState("processing");
        onResult(transcript);
      } else {
        setState("idle");
      }
    };

    recognition.onerror = (e: { error: string }) => {
      if (abortedRef.current) return;
      const msg =
        e.error === "not-allowed"
          ? "Microphone access denied. Please allow it in your browser settings."
          : e.error === "no-speech"
          ? "No speech detected — please try again."
          : "Couldn't hear you — please try again.";
      setState("error");
      onError?.(msg);
      setTimeout(() => setState("idle"), 2500);
    };

    recognition.onend = () => {
      if (!abortedRef.current) setState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, state, lang, onResult, onError]);

  const stop = useCallback(() => {
    abortedRef.current = true;
    recognitionRef.current?.abort();
    setState("idle");
  }, []);

  return { start, stop, state, supported };
}
