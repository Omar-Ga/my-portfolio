"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import styles from "./GlobalNav.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function GlobalNav() {
  const navRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useGSAP(() => {
    // Start nav hidden and slightly translated up
    gsap.set(navRef.current, { yPercent: -100, autoAlpha: 0 });

    // Animate it down when the projects section hits the top of the viewport
    gsap.to(navRef.current, {
      yPercent: 0,
      autoAlpha: 1,
      duration: 0.6,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "#projects",
        start: "top top",
        toggleActions: "play none none reverse"
      }
    });
  });

  return (
    <nav className={`${styles.topNav} gsap-global-nav`} ref={navRef}>
      {[
        { name: "HOME", target: ".gsap-main-hero" },
        { name: "ABOUT", target: "#about" },
        { name: "CONTACT", target: "#contact" },
        { name: "PLACEHOLDER", target: "#placeholder" },
      ].map((item) => (
        <div
          key={item.name}
          className={styles.topNavItem}
          onClick={() => {
            if (item.name === "CONTACT") {
              window.dispatchEvent(new Event("open-contact"));
            } else if (lenis) {
              if (item.name === "ABOUT") {
                const st = ScrollTrigger.getById("showcase-st");
                if (st && st.animation) {
                  const progress = (st.animation as gsap.core.Timeline).labels["aboutPanel"] / st.animation.duration();
                  const scrollPos = st.start + (st.end - st.start) * progress;
                  lenis.scrollTo(scrollPos, { duration: 1.5 });
                }
              } else if (item.target === ".gsap-main-hero") {
                lenis.scrollTo(0, { duration: 1.5 });
              } else {
                const targetEl = document.querySelector(item.target) as HTMLElement;
                if (targetEl) {
                  lenis.scrollTo(targetEl, { duration: 1.5 });
                }
              }
            }
          }}
        >
          {item.name}
        </div>
      ))}
    </nav>
  );
}
