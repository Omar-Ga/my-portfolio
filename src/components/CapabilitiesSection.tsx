"use client";

import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './CapabilitiesSection.module.css';

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    id: 's1',
    title: 'Digital Strategy',
    description: 'We align your business goals with technical possibilities, defining the exact roadmap needed to dominate your industry without wasted effort.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop'
  },
  {
    id: 's2',
    title: 'Frontend Experience',
    description: 'Uncompromising user interfaces. We build fluid, high-performance web experiences with WebGL, GSAP, and Next.js that feel native and expensive.',
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=1600&auto=format&fit=crop'
  },
  {
    id: 's3',
    title: 'Backend Systems',
    description: 'Robust, infinitely scalable infrastructure. From serverless microservices to heavy data pipelines, we engineer backends that never bottleneck.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1600&auto=format&fit=crop'
  },
  {
    id: 's4',
    title: 'UI/UX Architecture',
    description: 'We don’t just make it look good. We design psychological flows that guide users exactly where they need to be, minimizing friction and maximizing conversion.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop'
  }
];

export default function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [activeImage, setActiveImage] = useState(0);

  // Handle the Image Crossfade whenever the active locked index changes
  useEffect(() => {
    const images = imageRefs.current.filter(Boolean);
    if (!images.length) return;

    gsap.to(images, { opacity: 0, scale: 1.05, duration: 0.8, ease: "power2.inOut" });
    gsap.to(images[activeImage], { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out", overwrite: true });
  }, [activeImage]);

  useGSAP(() => {
    if (!sectionRef.current || !listRef.current) return;
    
    const texts = textRefs.current.filter(Boolean);
    if (texts.length === 0) return;

    // Calculate scroll distances
    const listScrollHeight = listRef.current.scrollHeight;
    const viewportHeight = window.innerHeight;
    const windowCenter = viewportHeight / 2;
    const maxScrollY = listScrollHeight - viewportHeight;

    // Calculate EXACT snap points for the physical center of each item
    const snapPoints = (texts as HTMLDivElement[]).map((el) => {
      const itemCenterY = el.offsetTop + el.offsetHeight / 2;
      // We need list y to be targetY to center this item
      const targetY = windowCenter - itemCenterY;
      // Convert targetY to progress along the maxScrollY
      const progress = -targetY / maxScrollY;
      return Math.max(0, Math.min(1, progress));
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        start: "top top",
        end: `+=${SERVICES.length * 150}%`, // Scroll distance
        scrub: 0.5,
        snap: {
          snapTo: snapPoints,
          duration: { min: 0.2, max: 0.6 },
          ease: "power2.inOut"
        }
      },
      onUpdate: function() {
        // 3D Hamster Wheel Math
        const windowCenter = window.innerHeight / 2;
        const maxDist = window.innerHeight / 1.5; // Controls how fast it fades/rotates
        
        let minDistance = Infinity;
        let closestIdx = 0;

        texts.forEach((el, i) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          // Calculate center of this specific text element
          const elCenter = rect.top + rect.height / 2;
          const dist = elCenter - windowCenter;
          const absDist = Math.abs(dist);

          if (absDist < minDistance) {
            minDistance = absDist;
            closestIdx = i;
          }

          // Normalize distance (0 at center, 1 at edge)
          const normalizedDist = Math.max(0, Math.min(1, absDist / maxDist));
          
          // Apply 3D physics
          const scale = 1 - (normalizedDist * 0.4);
          const opacity = 1 - (normalizedDist * 1.2); // Fades completely out before edge
          const rotateX = (dist / maxDist) * -60; // Tilts backward as it moves away

          gsap.set(el, {
            scale,
            opacity,
            rotateX,
            transformOrigin: "center center -200px" // Pushes the pivot point deep into the screen
          });
        });

        // Locking mechanism: Only trigger image swap if the item is definitively snapped near the center
        if (minDistance < 40) {
          setActiveImage((prev) => {
            if (prev !== closestIdx) return closestIdx;
            return prev;
          });
        }
      }
    });

    // Move the entire list UP
    tl.to(listRef.current, {
      y: -maxScrollY,
      ease: "none"
    });

    // Force an initial update to set 3D transforms before scrolling starts
    ScrollTrigger.refresh();

  }, { scope: sectionRef });

  return (
    <section className={styles.capabilitiesSection} ref={sectionRef} id="capabilities">
      <div className={styles.capabilitiesContainer}>
        
        {/* LEFT: Services 3D Wheel */}
        <div className={styles.servicesListWrapper}>
          <div className={styles.servicesList} ref={listRef}>
            {SERVICES.map((service, idx) => (
              <div 
                key={service.id} 
                className={styles.serviceItem}
                ref={el => {
                  textRefs.current[idx] = el;
                }}
              >
                <h3 className={styles.serviceTitle}>0{idx + 1} — {service.title}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Visual Canvas */}
        <div className={styles.visualCanvas}>
          {SERVICES.map((service, idx) => (
            <img 
              key={`img-${service.id}`}
              src={service.image}
              alt={service.title}
              className={styles.visualImage}
              ref={el => {
                imageRefs.current[idx] = el;
              }}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
