"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { useLenis } from 'lenis/react';
import styles from "./ProjectsShowcase.module.css";

// Register plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Flip);
}

const PROJECTS = [
  {
    id: "p1",
    title: "SkyCourt Warehouse Engine",
    role: "Systems Architect & Lead Developer",
    description: "Offline-first enterprise logistics & inventory management platform powered by Turso LibSQL embedded replicas, real-time barcode scanning, and multi-platform desktop/web deployment.",
    images: [
      "/images/skycourt/skycourt_1.webp",
      "/images/skycourt/skycourt_2.webp",
      "/images/skycourt/skycourt_3.webp",
      "/images/skycourt/skycourt_4.webp",
      "/images/skycourt/skycourt_5.webp"
    ]
  },
  {
    id: "p2",
    title: "Ultra-Premium Web Designs",
    role: "Creative Technologist & Web Architect",
    description: "Delivering bespoke, agency-grade websites without the traditional price tag. Showcasing a rich portfolio of high-impact visual designs, fluid motion, and high-converting web architecture.",
    images: [
      "/images/o2mation/o2mation_1.webp",
      "/images/o2mation/o2mation_2.webp",
      "/images/o2mation/o2mation_3.webp",
      "/images/o2mation/o2mation_4.webp",
      "/images/o2mation/o2mation_5.webp"
    ]
  },
  {
    id: "p3",
    title: "Kafa'a AI Talent Platform",
    role: "Lead AI & Full-Stack Engineer",
    description: "An enterprise AI recruitment SaaS that parses unstructured CV resumes, calculates multi-variable candidate match scores, and orchestrates automated AI candidate interviews.",
    images: [
      "/images/kafaa/kafaa_1.webp",
      "/images/kafaa/kafaa_2.webp",
      "/images/kafaa/kafaa_3.webp",
      "/images/kafaa/kafaa_4.webp",
      "/images/kafaa/kafaa_5.webp"
    ]
  }
];

const ProjectPanel = ({ project }: { project: typeof PROJECTS[0] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

  const handleSwap = (idx: number) => {
    if (idx === activeIndex) return;
    
    // 1. First: Record the state of all images in this specific project
    flipStateRef.current = Flip.getState(`.img-target-${project.id}`);
    
    // Trigger re-render which will swap the CSS classes
    setActiveIndex(idx);
  };

  useGSAP(() => {
    if (flipStateRef.current) {
      // 3. Play: Animate from the recorded state to the new CSS-applied state
      Flip.from(flipStateRef.current, {
        duration: 0.7,
        ease: "power3.inOut",
        absolute: true, // Prevents layout jumping during the animation
        nested: true
      });
      flipStateRef.current = null;
    }
  }, { scope: containerRef, dependencies: [activeIndex] });

  const getPosClass = (idx: number) => {
    if (idx === activeIndex) return styles.posMain;
    let rel = idx;
    if (idx > activeIndex) rel -= 1;
    return styles[`pos${rel}` as keyof typeof styles];
  };

  const displayImages = project.images && project.images.length > 0 
    ? project.images 
    : ["", "", "", "", ""];

  return (
    <div className={styles.projectPanel} ref={containerRef}>
      <div className={styles.imageLayout}>
        {displayImages.map((url, i) => (
          <div 
            key={i}
            className={`${styles.imageSlot} img-target-${project.id} ${getPosClass(i)}`}
            onClick={() => handleSwap(i)}
            data-flip-id={`img-${project.id}-${i}`}
          >
            {url ? (
              <picture style={{ width: '100%', height: '100%', display: 'block' }}>
                <source media="(max-width: 768px)" srcSet={url.replace(/\.webp$/, "_mobile.webp")} />
                <img 
                  src={url}
                  className={styles.projectImage}
                  alt={`Project screenshot ${i}`}
                  onLoad={() => {
                    if (typeof window !== "undefined") {
                      ScrollTrigger.refresh();
                    }
                  }}
                />
              </picture>
            ) : (
              <div className={styles.placeholderCard}>
                <span className={styles.placeholderLabel}>Frame {i + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.textSection}>
         <h2 className={styles.projectTitle}>{project.title}</h2>
         <p className={styles.projectRole}>{project.role}</p>
         <p className={styles.projectDescription}>{project.description}</p>
      </div>
    </div>
  );
};

export default function ProjectsShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const leftHalfRef = useRef<HTMLDivElement>(null);
  const rightHalfRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(() => {
    const track = trackRef.current;
    if (!track || !leftHalfRef.current || !rightHalfRef.current) return;

    const mm = gsap.matchMedia();

    // Desktop: Horizontal Pinning & Track Scroll
    mm.add("(min-width: 769px)", () => {
      const getInitialHoldDist = () => window.innerHeight * 0.20;
      const getHorizontalDist = () => track.scrollWidth - window.innerWidth;
      const getVerticalDist = () => window.innerHeight * 1.5;
      const getHoldDist = () => window.innerHeight * 0.4;

      gsap.set(leftHalfRef.current, { xPercent: -100, yPercent: 0 });
      gsap.set(rightHalfRef.current, { xPercent: 100, yPercent: 0 });
      
      const tl = gsap.timeline({
        scrollTrigger: {
          id: "showcase-st",
          trigger: sectionRef.current,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          refreshPriority: 5,
          end: () => "+=" + (getInitialHoldDist() + getHorizontalDist() + getVerticalDist() + getHoldDist())
        }
      });

      tl.to({}, { duration: () => getInitialHoldDist() });

      tl.to(track, {
        x: () => -getHorizontalDist(),
        ease: "none",
        duration: () => getHorizontalDist()
      });

      tl.addLabel("aboutPanel");

      tl.to(leftHalfRef.current, { 
        xPercent: 0, 
        ease: "none", 
        duration: () => getVerticalDist() 
      }, "aboutPanel")
      .to(rightHalfRef.current, { 
        xPercent: 0, 
        ease: "none", 
        duration: () => getVerticalDist() 
      }, "aboutPanel");

      tl.to({}, { duration: () => getHoldDist() });
    });

    // Mobile: Vertical Scroll with Pinned Window Reveal on About Teaser (Top & Bottom Doors)
    mm.add("(max-width: 768px)", () => {
      gsap.set(leftHalfRef.current, { xPercent: 0, yPercent: -100, force3D: true });
      gsap.set(rightHalfRef.current, { xPercent: 0, yPercent: 100, force3D: true });

      const teaserEl = sectionRef.current?.querySelector(`.${styles.aboutTeaserPanel}`);
      if (teaserEl) {
        const mobileTl = gsap.timeline({
          scrollTrigger: {
            id: "showcase-st",
            trigger: teaserEl,
            pin: true,
            start: "top top",
            end: "+=150%",
            scrub: 1,
            invalidateOnRefresh: true,
            refreshPriority: 5
          }
        });

        mobileTl.addLabel("aboutPanel");

        mobileTl.to(leftHalfRef.current, { yPercent: 0, ease: "none", duration: 1 }, "aboutPanel")
                .to(rightHalfRef.current, { yPercent: 0, ease: "none", duration: 1 }, "aboutPanel")
                .to({}, { duration: 0.4 });
      }
    });

    return () => mm.revert();
  }, { scope: sectionRef });

  return (
    <section className={styles.showcaseWrapper} ref={sectionRef} id="projects">
      <div className={styles.horizontalTrack} ref={trackRef}>
        {PROJECTS.map(p => (
          <ProjectPanel key={p.id} project={p} />
        ))}
        {/* The Horizontal Finale */}
        <div className={styles.aboutTeaserPanel}>
          <h2 className={styles.teaserTitle}>THE MIND<br/>BEHIND THE<br/>WORK.</h2>
          <p className={styles.teaserSubtitle}>SOLO FULL STACK ARCHITECT</p>
          
          {/* The Window Split Animation (Overlay) */}
          <div className={styles.windowContainer}>
            {/* Left Pillar */}
            <div className={`${styles.windowHalf} ${styles.leftHalf}`} ref={leftHalfRef}>
              <picture style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                <source media="(max-width: 768px)" srcSet="/images/split/tech_direction_mobile.webp" />
                <img 
                  src="/images/split/tech_direction.webp" 
                  alt="Technical Direction" 
                  className={styles.founderImage} 
                />
              </picture>
              <div className={styles.overlay}></div>
              <div className={styles.founderInfo}>
                <p className={styles.founderRole}>The Systems</p>
                <h3 className={styles.founderName} style={{ fontSize: "clamp(2rem, 3.5vw, 4rem)" }}>FULL STACK<br/>ARCHITECTURE</h3>
              </div>
            </div>

            {/* Right Pillar */}
            <div className={`${styles.windowHalf} ${styles.rightHalf}`} ref={rightHalfRef}>
              <picture style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                <source media="(max-width: 768px)" srcSet="/images/split/client_strategy_mobile.webp" />
                <img 
                  src="/images/split/client_strategy.webp" 
                  alt="Strategy & Operations" 
                  className={styles.founderImage} 
                />
              </picture>
              <div className={styles.overlay}></div>
              <div className={styles.founderInfo}>
                <p className={styles.founderRole}>The Craft</p>
                <h3 className={styles.founderName} style={{ fontSize: "clamp(2rem, 3.5vw, 4rem)" }}>CREATIVE<br/>DIRECTION</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
