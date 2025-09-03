"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  scale?: boolean;
  y?: number;
}

export function FadeIn({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  scale = false,
  y = 0,
}: FadeInProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const initialProps: gsap.TweenVars = {
      opacity: 0,
      y: y,
    };

    if (scale) {
      initialProps.scale = 0.95;
    }

    gsap.fromTo(
      elementRef.current,
      initialProps,
      {
        opacity: 1,
        y: 0,
        scale: scale ? 1 : undefined,
        duration: duration,
        delay: delay,
        ease: "power2.out",
      }
    );
  }, [delay, duration, scale, y]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}
