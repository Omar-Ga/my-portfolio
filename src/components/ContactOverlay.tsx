"use client";

import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import styles from './ContactOverlay.module.css';

interface ContactOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactOverlay({ isOpen, onClose }: ContactOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useGSAP(() => {
    if (!overlayRef.current) return;

    if (isOpen) {
      setShouldLoadVideo(true);
      if (videoRef.current && videoRef.current.readyState >= 2) {
        videoRef.current.play().catch(() => {});
      }

      // Fade in the transparent overlay container
      gsap.to(overlayRef.current, {
        autoAlpha: 1, // handles opacity and visibility
        duration: 0.5,
      });

      // Animate elements inside fading in
      gsap.fromTo(
        [closeBtnRef.current, contentRef.current],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          stagger: 0.2,
          ease: "power3.out",
          delay: 0.8 // Wait for environmental crossfade
        }
      );
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }

      // Retract the contact form
      gsap.to([closeBtnRef.current, contentRef.current], {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: "power2.in"
      });

      // Hide the overlay container
      gsap.to(overlayRef.current, {
        autoAlpha: 0,
        duration: 0.5,
        delay: 0.3
      });
    }
  }, [isOpen]);

  useGSAP(() => {
    if (isVideoLoaded && videoRef.current) {
      gsap.fromTo(
        videoRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out", force3D: true }
      );
    }
  }, [isVideoLoaded]);

  return (
    <section 
      className={`${styles.overlayWrapper} ${isOpen ? styles.active : ''}`}
      ref={overlayRef}
    >
      <video
        ref={videoRef}
        className={styles.videoBackground}
        loop
        muted
        playsInline
        style={{ opacity: isVideoLoaded ? 1 : 0 }}
        onLoadedData={() => {
          setIsVideoLoaded(true);
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }}
      >
        {shouldLoadVideo && (
          <source src="/dark_cropped.webm" type="video/webm" />
        )}
      </video>

      <div className={styles.contentContainer}>
        <button 
          className={styles.closeBtn} 
          onClick={onClose}
          ref={closeBtnRef}
          aria-label="Close Contact Form"
        >
          &#10005;
        </button>

        <div className={styles.mainLayout} ref={contentRef}>
          <div className={styles.leftCol}>
            <h1 className={styles.title}>Let&apos;s<br />Talk.</h1>
            <p className={styles.subtitle}>
              Whether you have a massive project in mind or just want to discuss the boundaries of web architecture, I&apos;m always open to talking with ambitious people.
            </p>
          </div>

          <div className={styles.rightCol}>
            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              <div className={styles.inputGroup}>
                <input type="text" placeholder="YOUR NAME" className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <input type="email" placeholder="EMAIL ADDRESS" className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <textarea placeholder="WHAT'S ON YOUR MIND?" className={styles.textarea} required></textarea>
              </div>
              <button type="submit" className={styles.submitBtn}>Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
