"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '@/app/page.module.css';

gsap.registerPlugin(ScrollTrigger);

const paragraphs = [
  "We operate on a two-pillar foundation. One of us lives in the code, isolated and hyper-focused on engineering flawless, straight-to-the-point systems. The other lives in the strategy, managing client relations, marketing, and ensuring absolute clarity from day one. When you work with us, you get senior-level craftsmanship without the complications.",
  "We don’t deliver over-engineered AI slop or rely on standard templates. Every line of code, every feature, and every design choice is made with purpose. We build features that don’t just work—they amaze.",
  "From the architecture to the aesthetics, the result is a premium digital product. Your vision is in elite hands. We take the complexity out of the process, leaving you with total reassurance and a product that redefines your industry."
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
