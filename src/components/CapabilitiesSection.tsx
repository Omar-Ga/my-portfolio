"use client";

import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RippleCanvas from './RippleCanvas';
import AudioBlob from './AudioBlob';
import styles from './CapabilitiesSection.module.css';
import { WebGLShader } from './ui/web-gl-shader';

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    id: 's1',
    title: 'Digital Strategy',
    description: 'I align your business goals with technical possibilities, defining the exact roadmap needed to scale without wasted effort.',
    image: '/images/services/strategy.webp'
  },
  {
    id: 's2',
    title: 'Frontend Experience',
    description: 'Uncompromising user interfaces. I build fluid, high-performance web experiences with WebGL, GSAP, and Next.js that feel native, responsive, and premium.',
    image: '/images/services/frontend.webp'
  },
  {
    id: 's3',
    title: 'Backend Systems',
    description: 'Robust, scalable infrastructure. From serverless microservices to heavy data pipelines, I engineer backends built for high performance.',
    image: '/images/services/backend.webp'
  },
  {
    id: 's4',
    title: 'UI/UX Architecture',
    description: 'I don’t just make it look good. I design intuitive user flows that guide visitors seamlessly, minimizing friction and maximizing conversion.',
    image: '/images/services/uiux.webp'
  },
  {
    id: 's5',
    title: "Let's Talk",
    description: 'Skip the contact form. Ask me anything — my AI knows my stack, my work, and my availability. Press the button and speak.',
    image: '/images/services/strategy.webp'
  }
];

const SERVICE_IMAGES = SERVICES.map(s => s.image);

export default function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [activeImage, setActiveImage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      const targetY = windowCenter - itemCenterY;
      const progress = -targetY / maxScrollY;
      return Math.max(0, Math.min(1, progress));
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        start: "top top",
        end: `+=${SERVICES.length * 200}%`, // Reduced by ~20% to slightly increase scroll speed
        scrub: 0.7, // Tightened scrub slightly for faster response
        snap: {
          snapTo: snapPoints,
          duration: { min: 0.3, max: 0.8 },
          ease: "power2.inOut"
        }
      },
      onUpdate: function() {
        // Premium 3D Cylinder Math — relative to services list wrapper container
        const wrapper = listRef.current?.parentElement;
        const wrapperRect = wrapper ? wrapper.getBoundingClientRect() : { top: 0, height: window.innerHeight };
        const containerCenter = wrapperRect.top + wrapperRect.height / 2;
        const maxDist = wrapperRect.height / 1.5;
        
        let minDistance = Infinity;
        let closestIdx = 0;

        texts.forEach((el, i) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const elCenter = rect.top + rect.height / 2;
          const dist = elCenter - containerCenter;
          const absDist = Math.abs(dist);

          if (absDist < minDistance) {
            minDistance = absDist;
            closestIdx = i;
          }

          const normalizedDist = Math.max(0, Math.min(1, absDist / maxDist));
          
          // Easing curve: keeps the center item flat longer, sharply curves at the edges
          const curve = Math.pow(normalizedDist, 1.5);
          
          const scale = 1 - (curve * 0.3);
          const opacity = 1 - (curve * 1.0);
          
          // Re-introduce Z-depth but driven by the smooth curve so it doesn't mess up center spacing
          const rotateX = (dist / maxDist) * -90; // Balanced rotation angle
          const z = curve * -100; // Decreased pushback to prevent massive visual gaps

          gsap.set(el, {
            scale,
            opacity,
            rotateX,
            z,
            transformOrigin: "center center -150px" // Decreased cylinder radius to pack items closer
          });
        });

        if (minDistance < 60) {
          setActiveImage((prev) => {
            if (prev !== closestIdx) return closestIdx;
            return prev;
          });
        }
      }
    });

    tl.to(listRef.current, {
      y: -maxScrollY,
      ease: "none"
    });

    ScrollTrigger.refresh();

  }, { scope: sectionRef });

  return (
    <section className={styles.capabilitiesSection} ref={sectionRef} id="capabilities">
      {!isMobile && <WebGLShader />}
      <div className={styles.capabilitiesContainer} style={{ position: 'relative' }}>
        
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

        {/* RIGHT: WebGL Canvas / Audio AI Blob / Mobile Static Image */}
        <div className={styles.visualCanvas}>
          {activeImage === 4 ? (
            <AudioBlob />
          ) : isMobile ? (
            <img 
              src={SERVICE_IMAGES[Math.min(activeImage, 3)]} 
              alt="Service preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', transition: 'opacity 0.3s ease' }}
            />
          ) : (
            <RippleCanvas
              images={SERVICE_IMAGES.slice(0, 4)}
              activeIndex={Math.min(activeImage, 3)}
            />
          )}
        </div>

      </div>
    </section>
  );
}
