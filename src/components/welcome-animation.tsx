"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WELCOME_SEEN_KEY } from "@/lib/theme";

const WELCOME_TEXT = "Welcome to Nexo";
const LETTER_DELAY_MS = 50;
const LETTER_DURATION_MS = 350;
const PAUSE_AFTER_TYPE_MS = 500;
const FADE_OUT_DURATION_MS = 700;

/**
 * Plays once per browser session, on the first page load. Any click or key
 * skips it. The before-paint script in the root layout hides it (through
 * `html[data-welcome-seen]`) on later loads in the same session, so it never
 * flashes. Decorative, so hidden from assistive technology.
 */
export function WelcomeAnimation() {
  const [phase, setPhase] = useState<"playing" | "fading" | "done">("playing");

  useEffect(() => {
    // Already played this session: CSS keeps the overlay hidden.
    if (document.documentElement.hasAttribute("data-welcome-seen")) {
      return;
    }
    try {
      sessionStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      // Without storage it simply plays again on the next load.
    }

    const fade = () => setPhase((p) => (p === "playing" ? "fading" : p));
    const typingMs = WELCOME_TEXT.length * LETTER_DELAY_MS + LETTER_DURATION_MS;
    const timer = window.setTimeout(fade, typingMs + PAUSE_AFTER_TYPE_MS);
    window.addEventListener("keydown", fade);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", fade);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      onClick={() => setPhase("fading")}
      onTransitionEnd={() => phase === "fading" && setPhase("done")}
      className={cn(
        "welcome-overlay fixed inset-0 z-40 flex items-center justify-center bg-background transition-opacity ease-out",
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      style={{ transitionDuration: `${FADE_OUT_DURATION_MS}ms` }}
    >
      <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
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
            {char === " " ? " " : char}
          </span>
        ))}
        <span
          className="welcome-cursor inline-block"
          style={{
            animationName: "blink-cursor",
            animationDuration: "1s",
            animationTimingFunction: "steps(1)",
            animationIterationCount: "infinite",
          }}
        >
          |
        </span>
      </p>
    </div>
  );
}
