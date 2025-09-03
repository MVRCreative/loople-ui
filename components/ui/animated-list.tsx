"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
  y?: number;
}

export function AnimatedList({
  children,
  className = "",
  staggerDelay = 0.1,
  duration = 0.6,
  y = 20,
}: AnimatedListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;

    const listItems = listRef.current.querySelectorAll("[data-animate-item]");

    gsap.fromTo(
      listItems,
      {
        opacity: 0,
        y: y,
      },
      {
        opacity: 1,
        y: 0,
        duration: duration,
        stagger: staggerDelay,
        ease: "power2.out",
      }
    );
  }, [staggerDelay, duration, y]);

  return (
    <div ref={listRef} className={className}>
      {children}
    </div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className = "" }: AnimatedListItemProps) {
  return (
    <div data-animate-item className={className}>
      {children}
    </div>
  );
}
