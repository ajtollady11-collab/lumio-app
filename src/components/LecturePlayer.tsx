"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useVoice } from "@/lib/useVoice";

interface Slide {
  heading: string;
  points: string[];
  example?: { label: string; content: string };
  narration: string;
}

interface LectureData {
  type: "lecture";
  title: string;
  slides: Slide[];
}

type Phase = "loading" | "ready" | "playing" | "paused" | "done" | "error";

export function LecturePlayer({
  subject,
  topic,
  teacherName,
  voicePreference,
  firstName,
}: {
  subject: string;
  topic: string;
  teacherName: string;
  voicePreference: string;
  firstName: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(topic ? "loading" : "ready");
  const [topicInput, setTopicInput] = useState(topic);
  const [lecture, setLecture] = useState<LectureData | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const autoAdvanceRef = useRef(false);
  const { speak, stop, state: voiceState } = useVoice(voicePreference);

  // Generate lecture content — only when we have a topic
  useEffect(() => {
    if (!topicInput) return; // Wait for topic picker
    async function generate() {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // When topic was typed in the picker (no URL topic), use it as the subject too
          // so Claude doesn't get confused by a mismatched subject (e.g. "Maths" + "Macbeth")
          body: JSON.stringify({
            mode: "lecture",
            subject: topic ? subject : topicInput,
            topic: topicInput,
          }),
        });
        if (!res.ok) throw new Error("Generation failed");
        const json = await res.json();
        const data: LectureData = typeof json.data === "string" ? JSON.parse(json.data) : json.data;
        if (!data?.slides?.length) throw new Error("No slides generated");
        setLecture(data);
        setPhase("ready");
      } catch {
        setError("Couldn't generate the lecture. Please try again.");
        setPhase("error");
      }
    }
    if (phase === "loading") generate();
  }, [subject, topicInput, phase]);

  // Speak narration for current slide
  const speakSlide = useCallback((slide: Slide) => {
    setIsSpeaking(true);
    speak(slide.narration);
  }, [speak]);

  // Auto-advance when voice finishes
  useEffect(() => {
    if (voiceState === "idle" && isSpeaking && autoAdvanceRef.current && lecture) {
      setIsSpeaking(false);
      const next = slideIndex + 1;
      if (next < lecture.slides.length) {
        setSlideIndex(next);
        setTimeout(() => {
          if (autoAdvanceRef.current && lecture.slides[next]) {
            speakSlide(lecture.slides[next]);
          }
        }, 800); // Brief pause between slides
      } else {
        autoAdvanceRef.current = false;
        setPhase("done");
      }
    } else if (voiceState === "idle" && isSpeaking) {
      setIsSpeaking(false);
    }
  }, [voiceState, isSpeaking, slideIndex, lecture, speakSlide]);

  function startLecture() {
    if (!lecture) return;
    autoAdvanceRef.current = true;
    setPhase("playing");
    setSlideIndex(0);
    speakSlide(lecture.slides[0]);
  }

  function pause() {
    autoAdvanceRef.current = false;
    stop();
    setIsSpeaking(false);
    setPhase("paused");
  }

  function resume() {
    if (!lecture) return;
    autoAdvanceRef.current = true;
    setPhase("playing");
    speakSlide(lecture.slides[slideIndex]);
  }

  function goToSlide(idx: number) {
    if (!lecture) return;
    stop();
    setIsSpeaking(false);
    setSlideIndex(idx);
    if (phase === "playing") {
      autoAdvanceRef.current = true;
      setTimeout(() => speakSlide(lecture.slides[idx]), 300);
    }
  }

  function nextSlide() {
    if (!lecture || slideIndex >= lecture.slides.length - 1) return;
    goToSlide(slideIndex + 1);
  }

  function prevSlide() {
    if (slideIndex <= 0) return;
    goToSlide(slideIndex - 1);
  }

  const slide = lecture?.slides[slideIndex];
  const progress = lecture ? ((slideIndex + 1) / lecture.slides.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0f1a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <button
          onClick={() => { stop(); router.back(); }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/60 hover:bg-white/10"
        >
          ← Exit lecture
        </button>
        <div className="text-sm font-medium text-white/80">
          {lecture?.title ?? (topicInput ? topicInput : subject)}
        </div>
        <div className="text-sm text-white/40">
          {lecture ? `${slideIndex + 1} / ${lecture.slides.length}` : ""}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-[var(--indigo-2)] to-[var(--indigo)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Avatar */}
        <div className="flex w-64 shrink-0 flex-col items-center justify-end border-r border-white/10 bg-[#12142a] pb-8 pt-6">
          <TeacherAvatar
            name={teacherName}
            isSpeaking={voiceState === "playing"}
            phase={phase}
          />
          <div className="mt-4 text-center">
            <div className="text-sm font-semibold text-white">{teacherName}</div>
            <div className="mt-0.5 text-xs text-white/40">
              {voiceState === "playing" ? "Speaking…" : phase === "playing" ? "Next slide…" : "Your tutor"}
            </div>
          </div>

          {/* Slide thumbnails */}
          {lecture && (
            <div className="mt-6 w-full space-y-1 px-4">
              {lecture.slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    i === slideIndex
                      ? "bg-[var(--indigo)] text-white"
                      : "text-white/40 hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  {i + 1}. {s.heading.slice(0, 36)}{s.heading.length > 36 ? "…" : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Slide content */}
        <div className="flex flex-1 flex-col">

          {phase === "loading" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[var(--indigo)]" />
              <p className="text-white/60">
                {teacherName} is preparing your lecture on <strong className="text-white">{topic || subject}</strong>…
              </p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => router.back()}
                className="rounded-full bg-white/10 px-5 py-2 text-sm hover:bg-white/20"
              >
                Go back
              </button>
            </div>
          )}

          {/* Topic picker — shown when no topic given */}
          {phase === "ready" && !lecture && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-12">
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--indigo-2)]">{subject}</div>
                <h1 className="mt-3 font-display text-3xl font-semibold">What would you like a lecture on?</h1>
                <p className="mt-2 text-white/50">Your teacher will explain it slide by slide, with worked examples.</p>
              </div>
              <div className="flex w-full max-w-md flex-col gap-3">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && topicInput.trim()) setPhase("loading");
                  }}
                  placeholder={`e.g. Quadratic equations, The water cycle, World War 1…`}
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-[15px] text-white placeholder:text-white/30 outline-none focus:border-[var(--indigo)]"
                  autoFocus
                />
                <button
                  onClick={() => { if (topicInput.trim()) setPhase("loading"); }}
                  disabled={!topicInput.trim()}
                  className="rounded-full bg-[var(--indigo)] px-6 py-3.5 text-[15px] font-semibold disabled:opacity-40 hover:opacity-90"
                >
                  Generate lecture →
                </button>
              </div>
              {/* Quick topic suggestions */}
              <div className="flex flex-wrap justify-center gap-2">
                {["Macbeth", "The Water Cycle", "Quadratic Equations", "The French Revolution", "DNA and Genetics"].map((s) => (
                  <button key={s} onClick={() => { setTopicInput(s); setPhase("loading"); }}
                    className="rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] text-white/50 hover:border-white/30 hover:text-white/80">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "ready" && lecture && (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 px-12">
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--indigo-2)]">{subject}</div>
                <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">{lecture.title}</h1>
                <p className="mt-3 text-white/50">{lecture.slides.length} slides · approx {lecture.slides.length * 1.5} min</p>
              </div>
              <button
                onClick={startLecture}
                className="flex items-center gap-3 rounded-full bg-gradient-to-r from-[var(--indigo-2)] to-[var(--indigo)] px-8 py-4 text-lg font-semibold hover:opacity-90"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                Start lecture
              </button>
            </div>
          )}

          {(phase === "playing" || phase === "paused") && slide && (
            <div className="flex flex-1 flex-col px-12 py-8">
              {/* Slide heading */}
              <div className="mb-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--indigo-2)]">
                  Slide {slideIndex + 1} of {lecture?.slides.length}
                </div>
                <h2 className="mt-2 font-display text-3xl font-semibold">{slide.heading}</h2>
              </div>

              {/* Bullet points */}
              <div className="space-y-3">
                {slide.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-white/5 px-5 py-3.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--indigo)]/20 text-[11px] font-bold text-[var(--indigo-2)]">
                      {i + 1}
                    </span>
                    <p className="text-[15px] leading-relaxed text-white/90">{point}</p>
                  </div>
                ))}
              </div>

              {/* Worked example */}
              {slide.example && (
                <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-6 py-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">✏️</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--gold)]">{slide.example.label}</span>
                  </div>
                  <p className="whitespace-pre-wrap font-mono text-[14px] leading-relaxed text-white/80">
                    {slide.example.content}
                  </p>
                </div>
              )}

              {/* Narration text */}
              <div className={`mt-6 rounded-xl border px-5 py-4 text-[14px] leading-relaxed text-white/60 transition-all ${
                voiceState === "playing" ? "border-[var(--indigo)]/40 bg-[var(--indigo)]/10" : "border-white/10"
              }`}>
                {voiceState === "playing" && <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--indigo-2)]" />}
                {slide.narration}
              </div>
            </div>
          )}

          {phase === "done" && lecture && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-12 text-center">
              <div className="text-5xl">🎓</div>
              <h2 className="font-display text-3xl font-semibold">Lecture complete!</h2>
              <p className="text-white/60">You just covered {lecture.slides.length} slides on <strong className="text-white">{lecture.title}</strong>.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/learn?mode=quiz&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`)}
                  className="rounded-full bg-[var(--indigo)] px-6 py-3 text-sm font-semibold hover:opacity-90"
                >
                  Test yourself →
                </button>
                <button
                  onClick={() => router.back()}
                  className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold hover:bg-white/20"
                >
                  Go back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {(phase === "playing" || phase === "paused") && (
        <div className="flex items-center justify-center gap-4 border-t border-white/10 py-4">
          <button
            onClick={prevSlide}
            disabled={slideIndex === 0}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 disabled:opacity-30 hover:bg-white/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 20L9 12l10-8v16zM5 4h2v16H5z"/></svg>
          </button>

          {phase === "playing" ? (
            <button
              onClick={pause}
              className="grid h-14 w-14 place-items-center rounded-full bg-[var(--indigo)] hover:opacity-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
          ) : (
            <button
              onClick={resume}
              className="grid h-14 w-14 place-items-center rounded-full bg-[var(--indigo)] hover:opacity-90"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
            </button>
          )}

          <button
            onClick={nextSlide}
            disabled={!lecture || slideIndex >= lecture.slides.length - 1}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 disabled:opacity-30 hover:bg-white/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8V4zM17 4h2v16h-2z"/></svg>
          </button>

          <div className="ml-4 text-sm text-white/40">
            {phase === "paused" ? "Paused" : voiceState === "playing" ? `Speaking slide ${slideIndex + 1}…` : ""}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Animated Teacher Avatar ──────────────────────────────────────────────────

function TeacherAvatar({ name, isSpeaking, phase }: { name: string; isSpeaking: boolean; phase: Phase }) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--indigo)]/20 blur-xl" />
      )}

      {/* Avatar body */}
      <svg width="160" height="200" viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body / suit */}
        <rect x="30" y="140" width="100" height="60" rx="12" fill="#1e2040"/>
        <rect x="55" y="140" width="50" height="60" fill="#252750"/>

        {/* Neck */}
        <rect x="65" y="125" width="30" height="20" rx="4" fill="#c8a882"/>

        {/* Head */}
        <ellipse cx="80" cy="100" rx="45" ry="50" fill="#c8a882"/>

        {/* Hair */}
        <ellipse cx="80" cy="58" rx="45" ry="18" fill="#2d1f0e"/>
        <rect x="35" y="58" width="12" height="25" rx="6" fill="#2d1f0e"/>
        <rect x="113" y="58" width="12" height="25" rx="6" fill="#2d1f0e"/>

        {/* Eyes */}
        <ellipse cx="63" cy="95" rx="7" ry="7.5" fill="white"/>
        <ellipse cx="97" cy="95" rx="7" ry="7.5" fill="white"/>
        <ellipse cx="63" cy="96" rx="4" ry="4.5" fill="#2d1f0e"/>
        <ellipse cx="97" cy="96" rx="4" ry="4.5" fill="#2d1f0e"/>
        {/* Eye shine */}
        <circle cx="65" cy="94" r="1.5" fill="white"/>
        <circle cx="99" cy="94" r="1.5" fill="white"/>

        {/* Eyebrows */}
        <path d="M54 84 Q63 80 72 84" stroke="#2d1f0e" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M88 84 Q97 80 106 84" stroke="#2d1f0e" strokeWidth="2.5" strokeLinecap="round"/>

        {/* Nose */}
        <path d="M78 102 Q80 108 82 102" stroke="#b08060" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

        {/* Mouth — animated when speaking */}
        {isSpeaking ? (
          <ellipse cx="80" cy="120" rx="12" ry={7} fill="#8b4513">
            <animate attributeName="ry" values="3;7;4;8;3" dur="0.4s" repeatCount="indefinite"/>
          </ellipse>
        ) : (
          <path d="M68 118 Q80 126 92 118" stroke="#8b4513" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        )}

        {/* Collar */}
        <path d="M55 140 L65 155 L80 145 L95 155 L105 140" fill="#1a1c38" stroke="#252750" strokeWidth="1"/>
        {/* Tie */}
        <path d="M80 145 L75 165 L80 170 L85 165 Z" fill="#5b54e0"/>

        {/* Sound waves when speaking */}
        {isSpeaking && (
          <g opacity="0.6">
            <ellipse cx="130" cy="100" rx="4" ry="8" fill="none" stroke="#5b54e0" strokeWidth="2">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.6s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="142" cy="100" rx="4" ry="14" fill="none" stroke="#5b54e0" strokeWidth="1.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.6s" repeatCount="indefinite" begin="0.1s"/>
            </ellipse>
          </g>
        )}
      </svg>

      {/* Status indicator */}
      <div className={`mt-2 h-2 w-2 rounded-full ${
        phase === "loading" ? "animate-pulse bg-yellow-400" :
        isSpeaking ? "animate-pulse bg-green-400" :
        "bg-white/30"
      }`} />
    </div>
  );
}
