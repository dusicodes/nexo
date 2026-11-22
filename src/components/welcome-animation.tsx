"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const WELCOME_TEXT = "Welcome to Nexo";
const TYPING_INTERVAL_MS = 70;
const PAUSE_AFTER_TYPE_MS = 500;
const FADE_OUT_DURATION_MS = 700;

export function WelcomeAnimation() {
  const [visible, setVisible] = useState(true);
  const [text, setText] = useState("");
  const [isFading, setIsFading] = useState(false);
  const typeTimerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const skippedRef = useRef(false);

  const dismiss = (delay = FADE_OUT_DURATION_MS) => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    setText(WELCOME_TEXT);
    setIsFading(true);
    timeoutRef.current = window.setTimeout(() => setVisible(false), delay);
  };

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      timeoutRef.current = window.setTimeout(() => {
        setText(WELCOME_TEXT);
        dismiss(FADE_OUT_DURATION_MS);
      }, PAUSE_AFTER_TYPE_MS);
    } else {
      let index = 0;
      typeTimerRef.current = window.setInterval(() => {
        index += 1;
        setText(WELCOME_TEXT.slice(0, index));

        if (index >= WELCOME_TEXT.length) {
          if (typeTimerRef.current) window.clearInterval(typeTimerRef.current);
          timeoutRef.current = window.setTimeout(
            () => dismiss(FADE_OUT_DURATION_MS),
            PAUSE_AFTER_TYPE_MS
          );
        }
      }, TYPING_INTERVAL_MS);
    }

    return () => {
      if (typeTimerRef.current) window.clearInterval(typeTimerRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden={isFading}
      onClick={() => dismiss(FADE_OUT_DURATION_MS)}
      className={cn(
        "fixed inset-0 z-40 flex cursor-default items-center justify-center bg-background transition-opacity duration-700 ease-out",
        isFading ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <h1 className="pointer-events-none text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {text}
        <span className="animate-pulse" aria-hidden="true">
          |
        </span>
      </h1>
    </div>
  );
}
