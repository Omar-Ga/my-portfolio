"use client";

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import styles from './page.module.css';

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrambleTextPlugin);
}

const rotatingPhrases = [
  "CODE & ARCHITECTURE.",
  "FRONTEND INTERFACES.",
  "BACKEND SYSTEMS.",
  "SCALABLE APIS.",
  "SMOOTH ANIMATIONS."
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP((context, contextSafe) => {
    // Performance optimizations
    gsap.defaults({ force3D: true, lazy: false });

    // ================================================================
    // 1. CINEMATIC BOOT-UP ENTRY SEQUENCE
    // ================================================================

    // Initial states: everything hidden
    gsap.set(".gsap-video-bg", { autoAlpha: 0, scale: 1.05 });
    gsap.set(".gsap-main-hero", { opacity: 0 });
    gsap.set(".gsap-main-elem", { autoAlpha: 0, y: 30 });
    gsap.set(".gsap-title-decode", { autoAlpha: 0 });
    gsap.set(".gsap-rotating-container", { autoAlpha: 0 });
    gsap.set(".gsap-cta", { autoAlpha: 0, y: 40 });
    gsap.set(".gsap-subtitle", { autoAlpha: 0, y: 20 });
    gsap.set(".gsap-intro-1, .gsap-intro-2, .gsap-intro-3", { x: -20, opacity: 0 });

    const entryTl = gsap.timeline({ delay: 0.3 });

    // Act 1: Cinematic Text Intro
    entryTl.addLabel("intro", 0)
      .to(".gsap-intro-1", { x: 0, scale: 1.02, opacity: 1, duration: 1.5, ease: "power2.out" }, "intro")
      .to(".gsap-intro-1", { x: 20, scale: 1.05, opacity: 0, duration: 1, ease: "power2.in" })
      .to(".gsap-intro-2", { x: 0, scale: 1.02, opacity: 1, duration: 1.5, ease: "power2.out" })
      .to(".gsap-intro-2", { x: 20, scale: 1.05, opacity: 0, duration: 1, ease: "power2.in" })
      .to(".gsap-intro-3", { x: 0, scale: 1.02, opacity: 1, duration: 1.5, ease: "power2.out" })
      .to(".gsap-intro-3", { x: 20, scale: 1.05, opacity: 0, duration: 1, ease: "power2.in" })
      // Fade out overlay and reveal video/hero
      .addLabel("reveal", ">")
      .to(".gsap-dark-overlay", { opacity: 0, duration: 1.5 }, "reveal")
      .to(".gsap-video-bg", { autoAlpha: 1, duration: 1.5 }, "reveal")
      .to(".gsap-main-hero", { opacity: 1, duration: 1.5 }, "reveal");

    // Act 2: Title Decode — ScrambleText reveals each title line
    entryTl.addLabel("decode", "reveal+=0.5")
      .to(".gsap-title-decode", { autoAlpha: 1, duration: 0.01 }, "decode");

    const titleLines = gsap.utils.toArray(".gsap-title-decode") as HTMLElement[];
    titleLines.forEach((line, i) => {
      const originalText = line.textContent || "";
      entryTl.to(line, {
        duration: 2.5, // Extended duration
        scrambleText: {
          text: originalText,
          chars: "!@#$%^&*<>[]{}=/\\|~`",
          revealDelay: 0.8, // Wait longer before revealing real characters
          speed: 0.3 // Slower symbol scrambling
        },
        ease: "none"
      }, `decode+=${i * 0.4}`); // Increased stagger time
    });

    // Show rotating text container alongside decode
    entryTl.to(".gsap-rotating-container", { autoAlpha: 1, duration: 0.4 }, "decode+=0.2");

    // Act 3: Elements slide into place
    entryTl.addLabel("elements", "decode+=0.8")
      .to(".gsap-main-elem", {
        autoAlpha: 1, y: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out"
      }, "elements")
      .to(".gsap-subtitle", {
        autoAlpha: 1, y: 0,
        duration: 0.7,
        ease: "power3.out"
      }, "elements+=0.2");

    // Act 4: CTA button slams in with overshoot
    entryTl.addLabel("cta", "elements+=0.4")
      .to(".gsap-cta", {
        autoAlpha: 1, y: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "cta");

    // ================================================================
    // 2. ROTATING TEXT (runs independently, cycles in background)
    // ================================================================
    const textContainers = gsap.utils.toArray('[class*="rotatingTextContainer"]');

    textContainers.forEach(container => {
      const rotatingItems = gsap.utils.toArray(".gsap-rotating-item", container as Element) as Element[];
      if (rotatingItems.length === 0) return;

      gsap.set(rotatingItems, { yPercent: 100, opacity: 0 });
      gsap.set(rotatingItems[0], { yPercent: 0, opacity: 1 });

      const rotatingTl = gsap.timeline({ repeat: -1 });

      rotatingItems.forEach((item, i) => {
        const nextItem = rotatingItems[(i + 1) % rotatingItems.length];

        rotatingTl
          .to({}, { duration: 2.5 })
          .to(item, {
            yPercent: -100,
            opacity: 0,
            duration: 0.7,
            ease: "power2.inOut"
          }, "transition" + i)
          .set(nextItem, { yPercent: 100, opacity: 0 }, "transition" + i)
          .to(nextItem, {
            yPercent: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power2.inOut"
          }, "transition" + i);
      });
    });

    // ================================================================
    // 3. MAGNETIC HOVER & GLOBAL PARALLAX FOR NAV ITEMS
    // ================================================================
    const navItems = gsap.utils.toArray(".gsap-nav-item") as HTMLElement[];

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

    // ================================================================
    // 4. VIDEO BACKGROUND PARALLAX (quickTo for 60fps)
    // ================================================================
    const videoBg = document.querySelector(".gsap-video-bg") as HTMLElement | null;
    const videoXTo = videoBg ? gsap.quickTo(videoBg, "x", { duration: 1.2, ease: "power2" }) : null;
    const videoYTo = videoBg ? gsap.quickTo(videoBg, "y", { duration: 1.2, ease: "power2" }) : null;

    // ================================================================
    // 5. CUSTOM MAGNETIC CURSOR (Dot only)
    // ================================================================
    const isHoverDevice = window.matchMedia("(hover: hover)").matches;
    const cursorDot = document.querySelector(".gsap-cursor-dot") as HTMLElement | null;

    let dotXTo: ReturnType<typeof gsap.quickTo> | null = null;
    let dotYTo: ReturnType<typeof gsap.quickTo> | null = null;

    if (isHoverDevice && cursorDot) {
      gsap.set(cursorDot, { xPercent: -50, yPercent: -50 });
      dotXTo = gsap.quickTo(cursorDot, "x", { duration: 0.15, ease: "power3" });
      dotYTo = gsap.quickTo(cursorDot, "y", { duration: 0.15, ease: "power3" });

      // Reveal cursor elements
      gsap.set(cursorDot, { autoAlpha: 1 });

      // Hide default cursor
      document.body.style.cursor = "none";
      if (containerRef.current) containerRef.current.style.cursor = "none";
    }

    // ================================================================
    // GLOBAL MOUSE MOVE — drives nav parallax, video parallax, cursor
    // ================================================================
    const onGlobalMouseMove = contextSafe!((e: MouseEvent) => {
      if (!containerRef.current) return;

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

      // Video parallax (inverse direction for depth)
      if (videoXTo && videoYTo) {
        videoXTo(-globalNx * 15);
        videoYTo(-globalNy * 15);
      }

      // Custom cursor tracking
      if (isHoverDevice && dotXTo && dotYTo) {
        dotXTo(clientX);
        dotYTo(clientY);
      }
    });

    // ================================================================
    // NAV ITEM EVENT HANDLERS
    // ================================================================
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

    if (containerRef.current) {
      containerRef.current.addEventListener("mousemove", onGlobalMouseMove as EventListener);
    }

    navItems.forEach((item) => {
      item.addEventListener("mouseenter", onEnter as EventListener);
      item.addEventListener("mousemove", onMouseMove as EventListener);
      item.addEventListener("mouseleave", onLeave as EventListener);
    });

    // ================================================================
    // 6. CTA BUTTON — Blueprint Fracture Animation
    // ================================================================
    const ctaBtn = document.querySelector(".gsap-cta") as HTMLElement | null;
    let ctaCleanup: (() => void) | null = null;

    if (ctaBtn) {
      const ctaBg       = ctaBtn.querySelector(".gsap-cta-bg") as HTMLElement;
      const ctaTextBase = ctaBtn.querySelector(".gsap-cta-text-base") as HTMLElement;
      const ctaTextWhite= ctaBtn.querySelector(".gsap-cta-text-white") as HTMLElement;
      const strip1      = ctaBtn.querySelector(".gsap-cta-strip-1") as HTMLElement;
      const strip2      = ctaBtn.querySelector(".gsap-cta-strip-2") as HTMLElement;
      const strip3      = ctaBtn.querySelector(".gsap-cta-strip-3") as HTMLElement;

      gsap.set([strip1, strip2, strip3], { autoAlpha: 0 });

      const ctaTl = gsap.timeline({ paused: true });

      // Act 1 — Fracture
      ctaTl.addLabel("fracture", 0)
        .set([strip1, strip2, strip3], { autoAlpha: 1 }, "fracture")
        .to(strip1, { x: 10, duration: 0.12, ease: "power4.out" }, "fracture")
        .to(strip2, { x: -14, duration: 0.12, ease: "power4.out" }, "fracture")
        .to(strip3, { x: 10, duration: 0.12, ease: "power4.out" }, "fracture")

      // Act 2 — Reassemble + Scramble
        .addLabel("reassemble", "fracture+=0.12")
        .to([strip1, strip2, strip3], { x: 0, duration: 0.08, ease: "power4.in" }, "reassemble")
        .set([strip1, strip2, strip3], { autoAlpha: 0 }, "reassemble+=0.08")
        .to(ctaTextBase, {
          duration: 0.55,
          scrambleText: { text: "VIEW PROJECTS", chars: "<>/[]{}=%", revealDelay: 0.1, speed: 0.8 },
          ease: "none"
        }, "reassemble")

      // Act 3 — Dark Fill + text swap
        .addLabel("fill", "reassemble+=0.15")
        .to(ctaBg, { scaleX: 1, duration: 0.35, ease: "power3.inOut" }, "fill")
        .to(ctaTextWhite, { autoAlpha: 1, duration: 0.2, ease: "power2.out" }, "fill+=0.15")
        .to(ctaTextBase, { autoAlpha: 0, duration: 0.15, ease: "power2.out" }, "fill");

      const onCtaEnter = contextSafe!(() => {
        ctaTl.play();
      });
      const onCtaLeave = contextSafe!(() => {
        ctaTl.reverse();
      });

      ctaBtn.addEventListener("mouseenter", onCtaEnter);
      ctaBtn.addEventListener("mouseleave", onCtaLeave);

      ctaCleanup = () => {
        ctaBtn.removeEventListener("mouseenter", onCtaEnter);
        ctaBtn.removeEventListener("mouseleave", onCtaLeave);
      };
    }

    // ================================================================
    // 7. AMBIENT SUBTITLE GLITCH
    // ================================================================
    const glitchWords = gsap.utils.toArray(".gsap-glitch-word") as HTMLElement[];
    let glitchCall: gsap.core.Tween | null = null;

    const triggerGlitch = () => {
      if (glitchWords.length === 0) return;
      const word = glitchWords[Math.floor(Math.random() * glitchWords.length)];
      const original = word.dataset.original || word.textContent || "";

      gsap.to(word, {
        duration: 1.2, // Extended from 0.3s
        scrambleText: { text: original, chars: "<>/[]{}=%", speed: 0.3 }, // Slowed down speed
        ease: "none",
        onComplete: scheduleNextGlitch
      });
    };

    const scheduleNextGlitch = () => {
      const delay = gsap.utils.random(5, 8);
      glitchCall = gsap.delayedCall(delay, triggerGlitch);
    };

    // Start the ambient glitch loop after entry sequence finishes
    entryTl.call(scheduleNextGlitch);

    // ================================================================
    // CLEANUP
    // ================================================================
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", onGlobalMouseMove as EventListener);
      }
      navItems.forEach((item) => {
        item.removeEventListener("mouseenter", onEnter as EventListener);
        item.removeEventListener("mousemove", onMouseMove as EventListener);
        item.removeEventListener("mouseleave", onLeave as EventListener);
      });
      if (ctaCleanup) ctaCleanup();
      if (glitchCall) glitchCall.kill();
      document.body.style.cursor = "";
    };

  }, { scope: containerRef });

  return (
    <main className={styles.main} ref={containerRef}>
      
      {/* Background Video */}
      <video 
        className={`${styles.videoBackground} gsap-video-bg`}
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/light_web.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay — Starts solid black for CRT flicker */}
      <div className={`${styles.darkOverlay} gsap-dark-overlay`}></div>

      {/* Cinematic Intro Texts (legacy structure, kept for potential reuse) */}
      <div className={styles.introTextContainer}>
        <div className={`${styles.introText} gsap-intro-1`}>Hi.</div>
        <div className={`${styles.introText} gsap-intro-2`}>My name is Omar Gamal.</div>
        <div className={`${styles.introText} gsap-intro-3`}>I craft digital experiences.</div>
      </div>

      {/* Main Hero */}
      <div className={`${styles.mainHeroContainer} gsap-main-hero`}>
        <div className={styles.contentWrapper}>
          
          {/* Sidebar */}
          <aside className={`${styles.sidebar} gsap-main-elem`}>
            <div className={styles.logo}>OG</div>
            <nav className={styles.nav}>
              {["ABOUT", "PROJECTS", "WRITING", "CONTACT"].map((item) => (
                <div 
                  key={item} 
                  className={`${styles.navItem} gsap-nav-item`}
                >
                  <span className={styles.navTextBase}>{item}</span>
                  <span className={`${styles.navTextOrange} gsap-nav-orange`}>{item}</span>
                  
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

          {/* Main Hero Area */}
          <section className={styles.hero}>
            
            {/* Title with ScrambleText decode + rotating element */}
            <h1 className={`${styles.title} gsap-main-elem`}>
              <span>
                <div className={`${styles.rotatingTextContainer} gsap-rotating-container`}>
                  {rotatingPhrases.map((phrase, idx) => (
                    <div 
                      key={idx} 
                      className={`${styles.rotatingItem} gsap-rotating-item ${idx === 0 ? styles.first : ''}`}
                    >
                      {phrase}
                    </div>
                  ))}
                </div>
              </span>
              <span className="gsap-title-decode">THE PORTFOLIO OF</span>
              <span className="gsap-title-decode">OMAR GAMAL.</span>
            </h1>
            
            <div className={`${styles.bottomSection} gsap-main-elem`}>
              {/* Text Content & Button */}
              <div className={styles.textContent}>
                <p className={`${styles.subtitle} gsap-subtitle`}>
                  Crafting <span className="gsap-glitch-word" data-original="digital">digital</span>{" "}
                  <span className="gsap-glitch-word" data-original="experiences">experiences</span> through<br />
                  <span className="gsap-glitch-word" data-original="elegant">elegant</span>{" "}
                  <span className="gsap-glitch-word" data-original="code">code</span> and{" "}
                  <span className="gsap-glitch-word" data-original="architecture">architecture</span>.
                </p>
                
                <button className={`${styles.cta} gsap-cta`}>
                  {/* Invisible spacer for intrinsic size */}
                  <span className={styles.ctaSpacer}>VIEW PROJECTS</span>

                  {/* Act 3: dark fill bg */}
                  <span className={`${styles.ctaBg} gsap-cta-bg`}></span>

                  {/* Base text (dark) */}
                  <span className={`${styles.ctaTextLayer} gsap-cta-text-base`}>VIEW PROJECTS</span>

                  {/* White text (fades in during Act 3) */}
                  <span className={`${styles.ctaTextLayer} ${styles.ctaTextWhite} gsap-cta-text-white`}>VIEW PROJECTS</span>

                  {/* Fracture strips */}
                  <span className={`${styles.ctaStrip} ${styles.ctaStrip1} gsap-cta-strip-1`}>VIEW PROJECTS</span>
                  <span className={`${styles.ctaStrip} ${styles.ctaStrip2} gsap-cta-strip-2`}>VIEW PROJECTS</span>
                  <span className={`${styles.ctaStrip} ${styles.ctaStrip3} gsap-cta-strip-3`}>VIEW PROJECTS</span>
                </button>
              </div>
            </div>
              
          </section>
          
        </div>
      </div>

      {/* Custom Cursor */}
      <div className={`${styles.cursorDot} gsap-cursor-dot`}></div>
    </main>
  );
}
