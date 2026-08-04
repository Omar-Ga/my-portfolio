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
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const checkMobile = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 150);
    };
    window.addEventListener('resize', checkMobile);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useGSAP(() => {
    if (!sectionRef.current || !listRef.current) return;
    
    const texts = textRefs.current.filter(Boolean) as HTMLDivElement[];
    if (texts.length === 0) return;

    // Pre-calculate container & item dimensions ONCE to avoid DOM reading during scroll
    const wrapper = listRef.current.parentElement;
    const wrapperHeight = wrapper ? wrapper.offsetHeight : window.innerHeight;
    const containerCenter = wrapperHeight / 2;
    const maxDist = wrapperHeight / 1.5;

    const itemCenters = texts.map(el => el.offsetTop + el.offsetHeight / 2);
    const listScrollHeight = listRef.current.scrollHeight;
    const maxScrollY = listScrollHeight - wrapperHeight;

    const snapPoints = itemCenters.map((itemCenterY) => {
      const targetY = containerCenter - itemCenterY;
      const progress = -targetY / Math.max(1, maxScrollY);
      return Math.max(0, Math.min(1, progress));
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        anticipatePin: 1,
        start: "top top",
        end: `+=${SERVICES.length * 200}%`,
        scrub: 0.7,
        refreshPriority: 6,
        invalidateOnRefresh: true,
        snap: {
          snapTo: snapPoints,
          duration: { min: 0.3, max: 0.8 },
          ease: "power2.inOut"
        },
        onUpdate: function(self) {
          // Pure math calculations without reading live DOM layout
          const currentY = -maxScrollY * self.progress;
          let minDistance = Infinity;
          let closestIdx = 0;

          itemCenters.forEach((itemCenterY, i) => {
            const el = texts[i];
            if (!el) return;

            // elCenter relative to wrapper top = itemCenterY + currentY
            const dist = (itemCenterY + currentY) - containerCenter;
            const absDist = Math.abs(dist);

            if (absDist < minDistance) {
              minDistance = absDist;
              closestIdx = i;
            }

            const normalizedDist = Math.max(0, Math.min(1, absDist / maxDist));
            const curve = Math.pow(normalizedDist, 1.5);
            
            const scale = 1 - (curve * 0.3);
            const opacity = 1 - (curve * 1.0);
            const rotateX = (dist / maxDist) * -45;
            const z = curve * -50;

            gsap.set(el, {
              scale,
              opacity,
              rotateX,
              z,
              transformOrigin: "center center -80px"
            });
          });

          if (minDistance < 60) {
            setActiveImage((prev) => (prev !== closestIdx ? closestIdx : prev));
          }
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
              src={SERVICE_IMAGES[Math.min(activeImage, 3)].replace(/\.webp$/, '_mobile.webp')} 
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
