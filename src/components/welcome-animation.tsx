"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const WELCOME_TEXT = "Welcome to Nexo";
const LETTER_DELAY_MS = 50;
const LETTER_DURATION_MS = 350;
const PAUSE_AFTER_TYPE_MS = 500;
const FADE_OUT_DURATION_MS = 700;

export function WelcomeAnimation() {
  const [visible, setVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);

  const dismiss = () => {
    if (isFading) return;
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    setIsFading(true);
  };

  useEffect(() => {
    const totalTypingMs = WELCOME_TEXT.length * LETTER_DELAY_MS + LETTER_DURATION_MS;
    fadeTimerRef.current = window.setTimeout(() => {
      setIsFading(true);
    }, totalTypingMs + PAUSE_AFTER_TYPE_MS);

    return () => {
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden={isFading}
      onClick={dismiss}
      onTransitionEnd={() => isFading && setVisible(false)}
      className={cn(
        "fixed inset-0 z-40 flex cursor-default items-center justify-center bg-background transition-opacity ease-out",
        isFading ? "pointer-events-none opacity-0" : "opacity-100"
      )}
      style={{ transitionDuration: `${FADE_OUT_DURATION_MS}ms` }}
    >
      <h1 className="pointer-events-none text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {WELCOME_TEXT.split("").map((char, index) => (
          <span
            key={index}
            className="welcome-letter inline-block"
            style={{
              animationName: "fade-in-up",
              animationDuration: `${LETTER_DURATION_MS}ms`,
              animationTimingFunction: "ease-out",
              animationFillMode: "forwards",
              animationDelay: `${index * LETTER_DELAY_MS}ms`,
              opacity: 0,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
        <span
          className="welcome-cursor inline-block"
          aria-hidden="true"
          style={{
            animationName: "blink-cursor",
            animationDuration: "1s",
            animationTimingFunction: "steps(1)",
            animationIterationCount: "infinite",
          }}
        >
          |
        </span>
      </h1>
    </div>
  );
}
