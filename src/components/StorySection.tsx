"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '@/app/page.module.css';

gsap.registerPlugin(ScrollTrigger);

const paragraphs = [
  "I operate on a dual-pillar discipline, coupling deep, scalable backend architecture with fluid, high-converting frontend interfaces. When you work with me, you get direct senior-level engineering craftsmanship without agency overhead or middle-management bloat.",
  "I don’t deliver over-engineered AI slop or rely on generic templates. Every line of code, every architectural decision, and every motion keyframe is crafted with purpose. I build products that don’t just work, they perform and amaze.",
  "From high-throughput backend systems to pixel-perfect micro-interactions, the result is an elite digital product. Your vision is backed by end-to-end technical excellence from day one."
];

export default function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Select all the word spans
    const words = gsap.utils.toArray<HTMLElement>('.gsap-story-word');
    
    if (words.length === 0) return;

    // Initially dim all words
    gsap.set(words, { opacity: 0.15 });

    // Scrub opacity to 1 as we scroll through the section
    gsap.to(words, {
      opacity: 1,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        start: "top top",
        end: "+=150%",
        scrub: 0.5,
      }
    });

  }, { scope: containerRef });

  return (
    <section className={styles.storySection} id="about" ref={containerRef}>
      <video 
        className={styles.storyVideo} 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/story_bg.webm" type="video/webm" />
        <source src="/story_bg.mp4" type="video/mp4" />
      </video>
      <div className={styles.storyContainer}>
        <h2 className={styles.storyHeadline}>PREMIUM EXECUTION.<br/>NO COMPROMISES.</h2>
        <div className={styles.storyContent}>
          {paragraphs.map((para, i) => (
            <p key={i}>
              {para.split(' ').map((word, j) => (
                <span key={`${i}-${j}`} className="gsap-story-word">
                  {word}{' '}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
