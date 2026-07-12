"use client";

import { ReactLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    
    // Refresh ScrollTrigger after Lenis initializes
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <ReactLenis ref={lenisRef} autoRaf={false} root>
      {children}
    </ReactLenis>
  );
}
