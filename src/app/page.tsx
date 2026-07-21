"use client";

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';

import CustomCursor from "@/components/CustomCursor";
import BootLoader from "@/components/BootLoader";
import SidebarNav from "@/components/SidebarNav";
import HeroSection from "@/components/HeroSection";
import GlobalNav from "@/components/GlobalNav";
import ProjectsShowcase from "@/components/ProjectsShowcase";
import StorySection from "@/components/StorySection";
import CapabilitiesSection from "@/components/CapabilitiesSection";
import ContactOverlay from "@/components/ContactOverlay";
import styles from './page.module.css';

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const lenis = useLenis();

  // Control scrolling with Lenis during the cinematic boot phase
  useEffect(() => {
    if (lenis) {
      if (!isLoaded) {
        lenis.stop();
      } else {
        lenis.start();
      }
    }
  }, [lenis, isLoaded]);

  // Listen for the global 'open-contact' event fired by any nav on the page
  useEffect(() => {
    const handleOpenContact = () => setIsContactOpen(true);
    window.addEventListener('open-contact', handleOpenContact);
    return () => window.removeEventListener('open-contact', handleOpenContact);
  }, []);
  
  // Environmental Lighting Shift when Contact overlay opens
  useGSAP(() => {
    if (isContactOpen) {
      // Dissolve the hero content
      gsap.to(".gsap-main-elem:not(.gsap-sidebar)", { opacity: 0, y: 30, duration: 1, ease: "power3.in" });
      
      // Invert sidebar color to white
      gsap.to(".gsap-sidebar", { color: "#fff", borderColor: "rgba(255,255,255,0.2)", duration: 1.5 });
      
      if (lenis) lenis.stop();
    } else {
      // Restore hero content
      gsap.to(".gsap-main-elem:not(.gsap-sidebar)", { opacity: 1, y: 0, duration: 1.5, ease: "power3.out", delay: 0.5 });
      
      // Restore sidebar color
      gsap.to(".gsap-sidebar", { color: "#000", borderColor: "var(--primary)", duration: 1.5 });
      
      if (lenis && isLoaded) lenis.start();
    }
  }, [isContactOpen, lenis, isLoaded]);

  // Video Background Parallax & Global Scroll Progress
  useGSAP((context, contextSafe) => {
    if (!isLoaded) return;

    // Video parallax
    const videoBg = document.querySelector(".gsap-video-bg") as HTMLElement | null;
    const videoXTo = videoBg ? gsap.quickTo(videoBg, "x", { duration: 1.2, ease: "power2" }) : null;
    const videoYTo = videoBg ? gsap.quickTo(videoBg, "y", { duration: 1.2, ease: "power2" }) : null;

    const onGlobalMouseMove = contextSafe!((e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const globalNx = (clientX / innerWidth) * 2 - 1;
      const globalNy = (clientY / innerHeight) * 2 - 1;

      if (videoXTo && videoYTo) {
        videoXTo(-globalNx * 30);
        videoYTo(-globalNy * 30);
      }
    });

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", onGlobalMouseMove as EventListener);
    }

    // Global scroll progress bar
    gsap.to(".gsap-scroll-progress", {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.1
      }
    });

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", onGlobalMouseMove as EventListener);
      }
    };
  }, { scope: wrapperRef, dependencies: [isLoaded] });

  return (
    <>
      <div className={`${styles.pageWrapper} gsap-page-wrapper`} ref={wrapperRef}>
        <GlobalNav />
        <main className={styles.main} ref={containerRef}>
          
          {/* Light Video Background */}
          <video 
            className={`${styles.videoBackgroundLight} gsap-video-light gsap-video-bg`}
            autoPlay 
            loop 
            muted 
            playsInline
          >
            <source src="/light_web.mp4" type="video/mp4" />
          </video>

          <BootLoader onComplete={() => setIsLoaded(true)} />

          {/* Main Hero Area */}
          <div className={`${styles.mainHeroContainer} gsap-main-hero`}>
            <div className={styles.contentWrapper}>
              <SidebarNav />
              <HeroSection />
            </div>
          </div>
        </main>

        {/* Invisible Scrub Spacer for Curtain Reveal */}
        <div className="gsap-scrub-spacer" style={{ height: "8000px", position: "relative", zIndex: 0 }}></div>

        {/* Projects Showcase & About Section merged */}
        {isLoaded && <ProjectsShowcase />}

        {/* Post-Animation Continuation */}
        {isLoaded && <StorySection />}

        {/* Capabilities / Services */}
        {isLoaded && <CapabilitiesSection />}

        {/* Custom Scroll Progress Bar */}
        {isLoaded && (
          <div className={styles.scrollProgressBarContainer}>
            <div className={`${styles.scrollProgressBarFill} gsap-scroll-progress`}></div>
          </div>
        )}
      </div>

      <ContactOverlay isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <CustomCursor />
    </>
  );
}
