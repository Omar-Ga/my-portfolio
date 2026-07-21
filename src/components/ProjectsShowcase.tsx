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
    title: "E-Commerce Platform",
    role: "Full Stack Engineer",
    description: "A high-performance modern e-commerce platform built with Next.js and Stripe, featuring a dynamic headless CMS.",
    images: [
      "https://images.unsplash.com/photo-1557821552-171051530d19?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "p2",
    title: "Financial Dashboard",
    role: "Frontend Architect",
    description: "Real-time interactive dashboard visualizing millions of data points with sub-second latency.",
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533750349088-cd871a92f312?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "p3",
    title: "AI Chat Interface",
    role: "Lead Developer",
    description: "An elegant, conversational UI integrating advanced LLMs directly into the browser workflow.",
    images: [
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1678286570176-96eb1adca744?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1679083216051-aa510a1a2c0e?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1674027444485-cec3da58eef4?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "p4",
    title: "Global Logistics API",
    role: "Backend Architect",
    description: "A robust set of microservices powering international supply chain tracking and predictive routing.",
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8ed7c159ad?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517436073-3b1b1b48b61c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "p5",
    title: "Healthcare Portal",
    role: "UX Engineer",
    description: "An accessible, HIPAA-compliant patient management interface designed for clarity and ease of use.",
    images: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584982751601-97d883c61009?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=800&auto=format&fit=crop"
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

  return (
    <div className={styles.projectPanel} ref={containerRef}>
      <div className={styles.imageLayout}>
        {project.images.map((url, i) => (
          <div 
            key={i}
            className={`${styles.imageSlot} img-target-${project.id} ${getPosClass(i)}`}
            onClick={() => handleSwap(i)}
            data-flip-id={`img-${project.id}-${i}`}
          >
            <img 
              src={url}
              className={styles.projectImage}
              alt={`Project screenshot ${i}`}
            />
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

    // Calculate dimensions
    const totalWidth = track.scrollWidth;
    const viewportWidth = window.innerWidth;
    const horizontalScrollDist = totalWidth - viewportWidth;
    const verticalScrollDist = window.innerHeight * 1.5; // Duration of window close
    const holdDist = window.innerHeight * 0.4; // Hold the closed window state before unpinning

    // Initial state for window halves
    gsap.set(leftHalfRef.current, { xPercent: -100 });
    gsap.set(rightHalfRef.current, { xPercent: 100 });
    
    const tl = gsap.timeline({
      scrollTrigger: {
        id: "showcase-st",
        trigger: sectionRef.current,
        pin: true,
        scrub: 1, // Smooth scrubbing
        // Total scroll distance is the horizontal scroll + the vertical window close + the hold
        end: () => "+=" + (horizontalScrollDist + verticalScrollDist + holdDist)
      }
    });

    // 1. Horizontal Scroll (duration corresponds to physical scroll pixels)
    tl.to(track, {
      x: -horizontalScrollDist,
      ease: "none",
      duration: horizontalScrollDist
    });

    // 2. Add Label so nav can jump exactly to the end of horizontal scroll
    tl.addLabel("aboutPanel");

    // 3. Window Close Animation (starts immediately after horizontal scroll)
    tl.to(leftHalfRef.current, { 
      xPercent: 0, 
      ease: "none", 
      duration: verticalScrollDist 
    }, "aboutPanel")
    .to(rightHalfRef.current, { 
      xPercent: 0, 
      ease: "none", 
      duration: verticalScrollDist 
    }, "aboutPanel");

    // 4. Hold the closed state
    tl.to({}, { duration: holdDist });

  }, { scope: sectionRef });

  return (
    <section className={styles.showcaseWrapper} ref={sectionRef} id="projects">
      <div className={styles.horizontalTrack} ref={trackRef}>
        {PROJECTS.map(p => (
          <ProjectPanel key={p.id} project={p} />
        ))}
        {/* The Horizontal Finale */}
        <div className={styles.aboutTeaserPanel}>
          <h2 className={styles.teaserTitle}>THE PEOPLE<br/>BEHIND THE<br/>WORK.</h2>
          <p className={styles.teaserSubtitle}>MEET THE FOUNDERS</p>
          
          {/* The Window Split Animation (Overlay) */}
          <div className={styles.windowContainer}>
            {/* Left Pillar */}
            <div className={`${styles.windowHalf} ${styles.leftHalf}`} ref={leftHalfRef}>
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop" 
                alt="Technical Direction" 
                className={styles.founderImage} 
              />
              <div className={styles.overlay}></div>
              <div className={styles.founderInfo}>
                <p className={styles.founderRole}>The Code</p>
                <h3 className={styles.founderName} style={{ fontSize: "clamp(2rem, 3.5vw, 4rem)" }}>TECHNICAL<br/>DIRECTION</h3>
              </div>
            </div>

            {/* Right Pillar */}
            <div className={`${styles.windowHalf} ${styles.rightHalf}`} ref={rightHalfRef}>
              <img 
                src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop" 
                alt="Strategy & Operations" 
                className={styles.founderImage} 
              />
              <div className={styles.overlay}></div>
              <div className={styles.founderInfo}>
                <p className={styles.founderRole}>The Strategy</p>
                <h3 className={styles.founderName} style={{ fontSize: "clamp(2rem, 3.5vw, 4rem)" }}>CLIENT<br/>RELATIONS</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
