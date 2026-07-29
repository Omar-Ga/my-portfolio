"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import styles from "./MobileNav.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const NAV_ITEMS = [
  { name: "HOME", target: ".gsap-main-hero" },
  { name: "PROJECTS", target: "#projects" },
  { name: "SERVICES", target: "#capabilities" },
  { name: "ABOUT", target: "#about" },
  { name: "CONTACT", target: "#contact" },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lenis = useLenis();

  // GSAP Drawer open/close animation
  useGSAP(() => {
    if (!drawerRef.current) return;

    if (isOpen) {
      // Slide up and fade in drawer
      gsap.to(drawerRef.current, {
        autoAlpha: 1,
        duration: 0.4,
        ease: "power3.out"
      });

      // Stagger animate links in
      const validItems = navItemsRef.current.filter(Boolean);
      if (validItems.length > 0) {
        gsap.fromTo(
          validItems,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            delay: 0.1
          }
        );
      }
    } else {
      const validItems = navItemsRef.current.filter(Boolean);
      if (validItems.length > 0) {
        gsap.to(validItems, {
          y: -15,
          opacity: 0,
          duration: 0.25,
          ease: "power2.in"
        });
      }

      gsap.to(drawerRef.current, {
        autoAlpha: 0,
        duration: 0.35,
        delay: 0.1,
        ease: "power3.in"
      });
    }
  }, [isOpen]);

  const handleNavClick = (item: typeof NAV_ITEMS[0]) => {
    setIsOpen(false);
    if (item.name === "CONTACT") {
      window.dispatchEvent(new Event("open-contact"));
    } else if (lenis) {
      if (item.name === "ABOUT") {
        const st = ScrollTrigger.getById("showcase-st");
        if (st && st.animation) {
          const progress = (st.animation as gsap.core.Timeline).labels["aboutPanel"] / st.animation.duration();
          const scrollPos = st.start + (st.end - st.start) * progress;
          lenis.scrollTo(scrollPos, { duration: 1.2 });
        } else {
          const aboutEl = document.querySelector("#about") as HTMLElement;
          if (aboutEl) lenis.scrollTo(aboutEl, { duration: 1.2 });
        }
      } else if (item.target === ".gsap-main-hero") {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        const targetEl = document.querySelector(item.target) as HTMLElement;
        if (targetEl) {
          lenis.scrollTo(targetEl, { duration: 1.2 });
        }
      }
    }
  };

  return (
    <>
      <header className={styles.mobileHeader}>
        <div 
          className={styles.logo}
          onClick={() => {
            if (lenis) lenis.scrollTo(0, { duration: 1 });
          }}
        >
          OG
        </div>
        <button
          className={`${styles.hamburgerBtn} ${isOpen ? styles.open : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`${styles.bar} ${styles.barTop}`} />
          <span className={`${styles.bar} ${styles.barBottom}`} />
        </button>
      </header>

      <div className={styles.drawerOverlay} ref={drawerRef}>
        <nav className={styles.drawerNav}>
          {NAV_ITEMS.map((item, idx) => (
            <div
              key={item.name}
              ref={(el) => {
                navItemsRef.current[idx] = el;
              }}
              className={styles.drawerNavItem}
              onClick={() => handleNavClick(item)}
            >
              <span className={styles.navIndex}>0{idx + 1}</span>
              <span>{item.name}</span>
            </div>
          ))}
        </nav>

        <div className={styles.drawerFooter}>
          <span className={styles.footerRole}>Omar Gamal — Portfolio</span>
          <span>2026</span>
        </div>
      </div>
    </>
  );
}
