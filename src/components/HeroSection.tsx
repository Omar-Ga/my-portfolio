"use client";

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';
import styles from './HeroSection.module.css';

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrambleTextPlugin, ScrollTrigger);
}

const rotatingPhrases = [
  "CODE & ARCHITECTURE.",
  "FRONTEND INTERFACES.",
  "BACKEND SYSTEMS.",
  "SCALABLE APIS.",
  "SMOOTH ANIMATIONS."
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP((context, contextSafe) => {
    // 2. ROTATING TEXT (runs independently, cycles in background)
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

    // 6. CTA BUTTON — Blueprint Fracture Animation
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
        ctaTl.kill();
      };
    }

    // 6. PHILOSOPHY SCROLL SEQUENCE
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".gsap-scrub-spacer",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      }
    });

    // Act 1: Fade out hero content (0% - 15%)
    scrollTl.addLabel("act1", 0)
      .fromTo(".gsap-main-elem, .gsap-title-decode, .gsap-rotating-container, .gsap-subtitle, .gsap-cta", 
      { autoAlpha: 1, y: 0 },
      {
        autoAlpha: 0,
        y: -30,
        duration: 0.15,
        stagger: 0.02,
        ease: "power2.inOut",
        immediateRender: false
      }, "act1");

    // Act 2: Video Collapse into Void (15% - 30%)
    scrollTl.addLabel("act2", 0.15)
      .fromTo(".gsap-video-bg", 
      { scale: 1.05, borderRadius: "0%", autoAlpha: 1 },
      {
        scale: 0,
        borderRadius: "50%",
        duration: 0.15,
        ease: "power2.inOut",
        immediateRender: false
      }, "act2")
      .to(".gsap-video-bg", {
        autoAlpha: 0,
        duration: 0.05,
        ease: "power2.in"
      }, "act2+=0.10");

    // Act 3: Typography Bespoke Flythrough (30% - 90%)
    
    // Phrase 1: Marquee across the screen (30% to 45%)
    gsap.set(".gsap-phrase-1", { xPercent: 150, autoAlpha: 0 });
    
    // Quick fade in right before it slides into view
    scrollTl.to(".gsap-phrase-1", { autoAlpha: 1, duration: 0.01 }, 0.29);
    
    scrollTl.fromTo(".gsap-phrase-1",
      { xPercent: 150 },
      { xPercent: -150, duration: 0.15, ease: "none", immediateRender: false },
      0.30
    );

    // Quick fade out after it leaves
    scrollTl.to(".gsap-phrase-1", { autoAlpha: 0, duration: 0.01 }, 0.45);

    // Phrase 2: Sleek fade up with letter spacing (43% to 55%)
    gsap.set(".gsap-phrase-2", { y: 50, autoAlpha: 0, letterSpacing: "0em" });
    scrollTl.fromTo(".gsap-phrase-2",
      { y: 50, autoAlpha: 0, letterSpacing: "0em" },
      { y: -20, autoAlpha: 1, letterSpacing: "0.15em", duration: 0.08, ease: "power2.out", immediateRender: false },
      0.43
    ).to(".gsap-phrase-2", {
      y: -50, autoAlpha: 0, duration: 0.04, ease: "power2.in"
    }, 0.51);

    // Phrase 3: Clip-path reveal from left (53% to 65%)
    gsap.set(".gsap-phrase-3", { clipPath: "inset(0 100% 0 0)", autoAlpha: 1, x: -30 });
    scrollTl.fromTo(".gsap-phrase-3",
      { clipPath: "inset(0 100% 0 0)", x: -30 },
      { clipPath: "inset(0 0% 0 0)", x: 0, duration: 0.08, ease: "power3.inOut", immediateRender: false },
      0.53
    ).to(".gsap-phrase-3", {
      autoAlpha: 0, x: 30, duration: 0.04, ease: "power2.in"
    }, 0.61);

    // Phrase 4: Blur focus pull (63% to 75%)
    gsap.set(".gsap-phrase-4", { filter: "blur(20px)", autoAlpha: 0, scale: 1.2 });
    scrollTl.fromTo(".gsap-phrase-4",
      { filter: "blur(20px)", autoAlpha: 0, scale: 1.2 },
      { filter: "blur(0px)", autoAlpha: 1, scale: 1, duration: 0.08, ease: "power2.out", immediateRender: false },
      0.63
    ).to(".gsap-phrase-4", {
      filter: "blur(20px)", autoAlpha: 0, scale: 0.8, duration: 0.04, ease: "power2.in"
    }, 0.71);

    // Phrase 5: Slam into center and hold (75% to 90%)
    gsap.set(".gsap-phrase-5", { scale: 0.1, autoAlpha: 0 });
    scrollTl.fromTo(".gsap-phrase-5",
      { scale: 0.1, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.05, ease: "power2.out", immediateRender: false },
      0.75
    ).to(".gsap-phrase-5", {
      scale: 1.05, duration: 0.10, ease: "none"
    }, 0.80);

    // 7. AMBIENT SUBTITLE GLITCH
    const glitchWords = gsap.utils.toArray(".gsap-glitch-word") as HTMLElement[];
    let glitchCall: gsap.core.Tween | null = null;

    const triggerGlitch = () => {
      if (glitchWords.length === 0) return;
      const word = glitchWords[Math.floor(Math.random() * glitchWords.length)];
      const original = word.dataset.original || word.textContent || "";

      gsap.to(word, {
        duration: 1.2,
        scrambleText: { text: original, chars: "<>/[]{}=%", speed: 0.3 },
        ease: "none",
        onComplete: scheduleNextGlitch
      });
    };

    const scheduleNextGlitch = () => {
      const delay = gsap.utils.random(2, 4);
      glitchCall = gsap.delayedCall(delay, triggerGlitch);
    };

    scheduleNextGlitch();

    return () => {
      if (ctaCleanup) ctaCleanup();
      if (glitchCall) glitchCall.kill();
    };

  });

  return (
    <div ref={containerRef} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <span className="gsap-title-decode gsap-glitch-word" data-original="THE PORTFOLIO OF">THE PORTFOLIO OF</span>
          <span className="gsap-title-decode gsap-glitch-word" data-original="OMAR GAMAL.">OMAR GAMAL.</span>
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
            
            <button 
              className={`${styles.cta} gsap-cta`}
              onClick={() => {
                if (lenis) {
                  const targetEl = document.querySelector("#projects") as HTMLElement;
                  if (targetEl) {
                    lenis.scrollTo(targetEl, { duration: 1.5 });
                  }
                }
              }}
            >
              <span className={styles.ctaSpacer}>VIEW PROJECTS</span>
              <span className={`${styles.ctaBg} gsap-cta-bg`}></span>
              <span className={`${styles.ctaTextLayer} gsap-cta-text-base`}>VIEW PROJECTS</span>
              <span className={`${styles.ctaTextLayer} ${styles.ctaTextWhite} gsap-cta-text-white`}>VIEW PROJECTS</span>
              <span className={`${styles.ctaStrip} ${styles.ctaStrip1} gsap-cta-strip-1`}>VIEW PROJECTS</span>
              <span className={`${styles.ctaStrip} ${styles.ctaStrip2} gsap-cta-strip-2`}>VIEW PROJECTS</span>
              <span className={`${styles.ctaStrip} ${styles.ctaStrip3} gsap-cta-strip-3`}>VIEW PROJECTS</span>
            </button>
          </div>
        </div>
          
      </section>
      
      {/* Philosophy Sequence container */}
      <div className={styles.philosophyContainer}>
        <div className={`${styles.philosophyPhrase} ${styles.phrase1} gsap-phrase-1`}>I DON&apos;T JUST WRITE CODE.</div>
        <div className={`${styles.philosophyPhrase} ${styles.phrase2} gsap-phrase-2`}>I ENGINEER SYSTEMS.</div>
        <div className={`${styles.philosophyPhrase} ${styles.phrase3} gsap-phrase-3`}>I ARCHITECT SOLUTIONS.</div>
        <div className={`${styles.philosophyPhrase} ${styles.phrase4} gsap-phrase-4`}>I CRAFT EXPERIENCES.</div>
        <div className={`${styles.philosophyPhrase} ${styles.phrase5} gsap-phrase-5`}>THIS IS MY WORK.</div>
      </div>
    </div>
  );
}
