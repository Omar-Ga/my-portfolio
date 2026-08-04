"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGeminiLive } from '../hooks/useGeminiLive';
import styles from './AudioBlob.module.css';

// -----------------------------------------------------------------------------
// Shaders for Main Liquid Blob Layer
// -----------------------------------------------------------------------------
const MAIN_VERTEX_SHADER = `
  uniform float u_time;
  uniform float u_audioAmp;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  // Simplex 3D Noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + D.xxxx;
    vec4 y = y_ *ns.x + D.xxxx;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    float time = u_time * 0.45;
    vec3 noisePos = position * 1.6 + vec3(time);
    float noise = snoise(noisePos);
    
    // Controlled, smooth organic displacement (max ~0.25)
    float displacement = noise * (0.07 + u_audioAmp * 0.22);
    vDisplacement = displacement;

    vec3 newPos = position + normal * displacement;
    
    // Compute smooth perturbed normal post-displacement
    float eps = 0.01;
    vec3 n1 = position + vec3(eps, 0.0, 0.0);
    vec3 n2 = position + vec3(0.0, eps, 0.0);
    float d1 = snoise(n1 * 1.6 + vec3(time)) * (0.07 + u_audioAmp * 0.22);
    float d2 = snoise(n2 * 1.6 + vec3(time)) * (0.07 + u_audioAmp * 0.22);
    vec3 tangent1 = normalize(vec3(eps, 0.0, d1 - displacement));
    vec3 tangent2 = normalize(vec3(0.0, eps, d2 - displacement));
    vec3 smoothNormal = normalize(cross(tangent1, tangent2));

    vViewNormal = normalize(normalMatrix * smoothNormal);
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    vViewPosition = mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const MAIN_FRAGMENT_SHADER = `
  uniform float u_time;
  uniform float u_speakingState; // 0.0 = listening/idle, 1.0 = AI speaking
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying float vDisplacement;

  void main() {
    vec3 viewDir = normalize(-vViewPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vViewNormal), 0.0), 2.2);

    // Color definitions for Idle/Listening vs AI Speaking
    vec3 deepCore   = mix(vec3(0.02, 0.1, 0.08), vec3(0.12, 0.02, 0.08), u_speakingState);
    vec3 emerald    = vec3(0.063, 0.725, 0.506); // #10b981
    vec3 cyan       = vec3(0.024, 0.714, 0.831); // #06b6d4
    vec3 rose       = vec3(0.957, 0.247, 0.369); // #f43f5e
    vec3 violet     = vec3(0.545, 0.361, 0.965); // #8b5cf6
    vec3 gold       = vec3(0.984, 0.749, 0.141); // #fbbf24

    vec3 listeningGrad = mix(emerald, cyan, clamp(vDisplacement * 3.0 + 0.5, 0.0, 1.0));
    vec3 speakingGrad  = mix(rose, violet, clamp(vDisplacement * 3.0 + 0.5, 0.0, 1.0));
    speakingGrad       = mix(speakingGrad, gold, clamp(vDisplacement * 4.0, 0.0, 1.0));

    vec3 surfaceColor = mix(listeningGrad, speakingGrad, u_speakingState);
    vec3 baseColor    = mix(deepCore, surfaceColor, 0.75 + vDisplacement * 0.4);

    // Glassy fresnel edge glow
    vec3 fresnelColor = mix(cyan, rose, u_speakingState);
    vec3 finalColor   = mix(baseColor, fresnelColor, fresnel * 0.85);

    gl_FragColor = vec4(finalColor, 0.88 + fresnel * 0.12);
  }
`;

// -----------------------------------------------------------------------------
// Shaders for Outer Aura Shell Layer (Additive translucent halo)
// -----------------------------------------------------------------------------
const AURA_VERTEX_SHADER = `
  uniform float u_time;
  uniform float u_audioAmp;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    float time = u_time * 0.35;
    vec3 newPos = position + normal * (sin(position.x * 2.5 + time) * 0.05 + u_audioAmp * 0.14);
    vViewNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    vViewPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const AURA_FRAGMENT_SHADER = `
  uniform float u_speakingState;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(-vViewPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vViewNormal), 0.0), 3.2);

    vec3 listeningAura = vec3(0.063, 0.725, 0.506); // Emerald
    vec3 speakingAura  = vec3(0.957, 0.247, 0.369); // Rose

    vec3 auraColor = mix(listeningAura, speakingAura, u_speakingState);
    gl_FragColor = vec4(auraColor, fresnel * 0.55);
  }
`;

// -----------------------------------------------------------------------------
// Shaders for Inner Glowing Energy Core
// -----------------------------------------------------------------------------
const CORE_VERTEX_SHADER = `
  uniform float u_time;
  uniform float u_audioAmp;

  void main() {
    vec3 newPos = position * (1.0 + sin(u_time * 2.5) * 0.04 + u_audioAmp * 0.25);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const CORE_FRAGMENT_SHADER = `
  uniform float u_speakingState;

  void main() {
    vec3 listeningCore = vec3(0.2, 0.9, 0.65);
    vec3 speakingCore  = vec3(1.0, 0.45, 0.65);
    vec3 coreColor     = mix(listeningCore, speakingCore, u_speakingState);
    gl_FragColor       = vec4(coreColor, 0.9);
  }
`;

export default function AudioBlob() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textInputVal, setTextInputVal] = useState('');

  const {
    status,
    userTranscript,
    aiTranscript,
    errorMsg,
    getAudioAmp,
    connect,
    disconnect,
    sendText
  } = useGeminiLive();

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (!parent) return;

    // 1. Scene & Camera Setup (Constrained to prevent screen overflow)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Multilayered Geometries & Uniforms
    const sharedUniforms = {
      u_time: { value: 0.0 },
      u_audioAmp: { value: 0.0 },
      u_speakingState: { value: 0.0 }
    };

    // Layer A: Inner Core (Radius 0.42)
    const coreGeo = new THREE.IcosahedronGeometry(0.42, 20);
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: CORE_VERTEX_SHADER,
      fragmentShader: CORE_FRAGMENT_SHADER,
      uniforms: sharedUniforms,
      transparent: true
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Layer B: Main Deforming Liquid Blob (Radius 0.72)
    const mainGeo = new THREE.IcosahedronGeometry(0.72, 36);
    const mainMat = new THREE.ShaderMaterial({
      vertexShader: MAIN_VERTEX_SHADER,
      fragmentShader: MAIN_FRAGMENT_SHADER,
      uniforms: sharedUniforms,
      transparent: true
    });
    const mainMesh = new THREE.Mesh(mainGeo, mainMat);
    scene.add(mainMesh);

    // Layer C: Outer Atmospheric Aura Halo (Radius 0.92)
    const auraGeo = new THREE.IcosahedronGeometry(0.92, 24);
    const auraMat = new THREE.ShaderMaterial({
      vertexShader: AURA_VERTEX_SHADER,
      fragmentShader: AURA_FRAGMENT_SHADER,
      uniforms: sharedUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    scene.add(auraMesh);

    // 3. Smooth Lerp State Variables & Render Loop
    let animationId: number;
    let isIntersecting = true;
    const startTime = performance.now();
    let currentAmp = 0.05;
    let currentSpeakingState = 0.0;

    const io = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
    }, { threshold: 0.05 });
    io.observe(canvas);

    const animate = () => {
      if (isIntersecting) {
        const elapsedTime = (performance.now() - startTime) * 0.001;
        sharedUniforms.u_time.value = elapsedTime;

        // Smooth Lerp on Audio Amplitude & Speaking State
        const targetAmp = getAudioAmp();
        currentAmp += (targetAmp - currentAmp) * 0.12;
        sharedUniforms.u_audioAmp.value = currentAmp;

        const targetSpeaking = statusRef.current === 'speaking' ? 1.0 : 0.0;
        currentSpeakingState += (targetSpeaking - currentSpeakingState) * 0.08;
        sharedUniforms.u_speakingState.value = currentSpeakingState;

        // Layered rotations for depth and movement
        mainMesh.rotation.y = elapsedTime * 0.18;
        mainMesh.rotation.x = Math.sin(elapsedTime * 0.12) * 0.12;

        auraMesh.rotation.y = -elapsedTime * 0.22;
        auraMesh.rotation.z = Math.cos(elapsedTime * 0.15) * 0.1;

        coreMesh.rotation.y = elapsedTime * 0.3;

        renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // 4. Responsive ResizeObserver Handling
    const handleResize = () => {
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(parent);

    return () => {
      io.disconnect();
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();

      coreGeo.dispose();
      coreMat.dispose();
      mainGeo.dispose();
      mainMat.dispose();
      auraGeo.dispose();
      auraMat.dispose();
      renderer.dispose();
    };
  }, [getAudioAmp]);

  const handleToggleConnect = () => {
    if (status === 'idle' || status === 'error') {
      connect();
    } else {
      disconnect();
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInputVal.trim()) {
      sendText(textInputVal.trim());
      setTextInputVal('');
    }
  };

  return (
    <div className={styles.blobContainer}>
      <canvas ref={canvasRef} className={styles.blobCanvas} />

      {/* Live Transcript Subtitle Overlay */}
      {(userTranscript || aiTranscript) && (
        <div className={styles.transcriptBox}>
          {userTranscript && (
            <div>
              <div className={styles.transcriptRole}>YOU</div>
              <div>{userTranscript}</div>
            </div>
          )}
          {aiTranscript && (
            <div style={{ marginTop: userTranscript ? '0.5rem' : 0 }}>
              <div className={`${styles.transcriptRole} ${styles.transcriptAiRole}`}>OMAR AI</div>
              <div>{aiTranscript}</div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Controls Overlay */}
      <div className={styles.overlayControls}>
        <div className={styles.statusPill}>
          <span
            className={`${styles.statusDot} ${
              status === 'listening' ? styles.statusDotActive : ''
            } ${status === 'speaking' ? styles.statusDotSpeaking : ''}`}
          />
          <span>
            {status === 'idle' && 'AI Voice Ready'}
            {status === 'connecting' && 'Connecting to Gemini...'}
            {status === 'listening' && 'Listening (Speak Now)'}
            {status === 'processing' && 'Gemini Thinking...'}
            {status === 'speaking' && 'AI Responding'}
            {status === 'error' && (errorMsg || 'Connection Error')}
          </span>
        </div>

        <button
          className={`${styles.talkButton} ${
            status !== 'idle' && status !== 'error' ? styles.talkButtonActive : ''
          }`}
          onClick={handleToggleConnect}
        >
          {status === 'idle' || status === 'error' ? 'Talk Now' : 'End Call'}
        </button>

        {/* Fallback Text Input */}
        {status !== 'idle' && status !== 'error' && (
          <form onSubmit={handleSendText} className={styles.textInputRow}>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Or type your message..."
              value={textInputVal}
              onChange={(e) => setTextInputVal(e.target.value)}
            />
            <button type="submit" className={styles.sendButton}>Send</button>
          </form>
        )}
      </div>
    </div>
  );
}


