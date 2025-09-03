"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
}

export function AnimatedText({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  y = 30,
}: AnimatedTextProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    gsap.fromTo(
      textRef.current,
      {
        opacity: 0,
        y: y,
      },
      {
        opacity: 1,
        y: 0,
        duration: duration,
        delay: delay,
        ease: "power2.out",
      }
    );
  }, [delay, duration, y]);

  return (
    <div ref={textRef} className={className}>
      {children}
    </div>
  );
}
