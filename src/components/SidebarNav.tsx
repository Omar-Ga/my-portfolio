"use client";

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';
import styles from './SidebarNav.module.css';

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function SidebarNav() {
  const containerRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useGSAP((context, contextSafe) => {
    // 3. MAGNETIC HOVER & GLOBAL PARALLAX FOR NAV ITEMS
    const navItems = gsap.utils.toArray(".gsap-nav-item", containerRef.current) as HTMLElement[];

    // 3.5 AMBIENT SIDEBAR SWEEP
    gsap.fromTo(".gsap-nav-sweep",
      { clipPath: "polygon(0% -60%, 100% -40%, 100% -20%, 0% -40%)" },
      {
        clipPath: "polygon(0% 140%, 100% 160%, 100% 180%, 0% 160%)",
        duration: 1.2,
        ease: "none",
        stagger: {
          each: 1.7,
          from: "end"
        },
        repeat: -1,
        repeatDelay: 2
      }
    );

    const itemTrackers = navItems.map(item => {
      const hoverTl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

      const orangeText = item.querySelector(".gsap-nav-orange");
      const bTop = item.querySelector(".gsap-border-top");
      const bRight = item.querySelector(".gsap-border-right");
      const bBottom = item.querySelector(".gsap-border-bottom");
      const bLeft = item.querySelector(".gsap-border-left");

      if (orangeText) {
        hoverTl.to(orangeText, { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "power3.out" }, 0);
      }

      if (bTop && bRight && bBottom && bLeft) {
        hoverTl.to(bBottom, { scaleX: 1, duration: 0.1 }, 0)
               .to(bLeft, { scaleY: 1, duration: 0.1 }, 0.1)
               .to(bTop, { scaleX: 1, duration: 0.1 }, 0.2)
               .to(bRight, { scaleY: 1, duration: 0.1 }, 0.3);
      }

      return {
        el: item,
        xTo: gsap.quickTo(item, "x", { duration: 0.4, ease: "power3" }),
        yTo: gsap.quickTo(item, "y", { duration: 0.4, ease: "power3" }),
        isHovered: false,
        hoverTl
      };
    });

    let globalNx = 0;
    let globalNy = 0;

    const onGlobalMouseMove = contextSafe!((e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      globalNx = (clientX / innerWidth) * 2 - 1;
      globalNy = (clientY / innerHeight) * 2 - 1;

      // Nav parallax
      itemTrackers.forEach(tracker => {
        if (!tracker.isHovered) {
          tracker.xTo(globalNx * 8);
          tracker.yTo(globalNy * 8);
        }
      });
    });

    const onEnter = contextSafe!((e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      const tracker = itemTrackers.find(t => t.el === target);
      if (tracker) {
        tracker.isHovered = true;
        tracker.hoverTl.play();
      }
    });

    const onMouseMove = contextSafe!((e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      const tracker = itemTrackers.find(t => t.el === target);

      if (tracker && tracker.isHovered) {
        const rect = target.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        const pullStrength = 0.4;
        tracker.xTo(dx * pullStrength);
        tracker.yTo(dy * pullStrength);
      }
    });

    const onLeave = contextSafe!((e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      const tracker = itemTrackers.find(t => t.el === target);

      if (tracker) {
        tracker.isHovered = false;
        tracker.xTo(globalNx * 8);
        tracker.yTo(globalNy * 8);
        tracker.hoverTl.reverse();
      }
    });

    window.addEventListener("mousemove", onGlobalMouseMove);

    navItems.forEach((item) => {
      item.addEventListener("mouseenter", onEnter);
      item.addEventListener("mousemove", onMouseMove);
      item.addEventListener("mouseleave", onLeave);
    });

    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      navItems.forEach((item) => {
        item.removeEventListener("mouseenter", onEnter);
        item.removeEventListener("mousemove", onMouseMove);
        item.removeEventListener("mouseleave", onLeave);
      });
    };
  }, { scope: containerRef });

  return (
    <aside ref={containerRef} className={`${styles.sidebar} gsap-main-elem gsap-sidebar`}>
      <div className={styles.logo}>OG</div>
      <nav className={styles.nav}>
        {[
          { name: "HOME", target: ".gsap-main-hero" },
          { name: "ABOUT", target: "#about" },
          { name: "CONTACT", target: "#contact" },
          { name: "PLACEHOLDER", target: "#placeholder" },
        ].map((item) => (
          <div 
            key={item.name} 
            className={`${styles.navItem} gsap-nav-item`}
            onClick={() => {
              if (item.name === "CONTACT") {
                window.dispatchEvent(new Event('open-contact'));
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
            <span className={styles.navTextBase}>{item.name}</span>
            <span className={`${styles.navTextOrange} gsap-nav-orange`}>{item.name}</span>
            <span className={`${styles.navTextSweep} gsap-nav-sweep`}>{item.name}</span>
            
            <div className={styles.borderContainer}>
              <span className={`${styles.borderTop} gsap-border-top`}></span>
              <span className={`${styles.borderRight} gsap-border-right`}></span>
              <span className={`${styles.borderBottom} gsap-border-bottom`}></span>
              <span className={`${styles.borderLeft} gsap-border-left`}></span>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
