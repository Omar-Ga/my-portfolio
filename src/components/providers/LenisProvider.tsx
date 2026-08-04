"use client";

import { ReactLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();

    const mql = window.matchMedia("(max-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handleChange);

    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(update);
    };
  }, [isMobile]);

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <ReactLenis ref={lenisRef} autoRaf={false} root>
      {children}
    </ReactLenis>
  );
}
