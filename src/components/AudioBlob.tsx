"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGeminiLive } from '../hooks/useGeminiLive';
import styles from './AudioBlob.module.css';

const VERTEX_SHADER = `
  uniform float u_time;
  uniform float u_audioAmp;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  // Simplex 3D Noise generator
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
    vNormal = normal;
    vPosition = position;

    float noise = snoise(position * 1.5 + vec3(u_time * 0.4));
    float displacement = noise * (0.15 + u_audioAmp * 0.45);
    vDisplacement = displacement;

    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float u_time;
  uniform float u_speakingState; // 0 = idle/listening, 1 = AI speaking
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

    // Color definitions
    vec3 emerald = vec3(0.133, 0.772, 0.368); // #22c55e
    vec3 teal    = vec3(0.054, 0.647, 0.914); // #0ea5e9
    vec3 rose    = vec3(0.882, 0.113, 0.282); // #e11d48
    vec3 darkCore= vec3(0.04, 0.08, 0.06);

    // Base color gradient based on displacement
    vec3 baseColor = mix(darkCore, mix(emerald, teal, vDisplacement + 0.2), 0.7);

    // Speaking accent pulse
    if (u_speakingState > 0.5) {
      baseColor = mix(baseColor, rose, 0.4 + vDisplacement * 0.3);
    }

    vec3 finalColor = mix(baseColor, mix(emerald, rose, u_speakingState), fresnel * 0.85);

    gl_FragColor = vec4(finalColor, 0.95);
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
  statusRef.current = status;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (!parent) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 0.1, 1000);
    camera.position.z = 3.8;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geometry = new THREE.IcosahedronGeometry(1.1, 32);
    const uniforms = {
      u_time: { value: 0.0 },
      u_audioAmp: { value: 0.0 },
      u_speakingState: { value: 0.0 }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationId: number;
    const startTime = performance.now();

    const animate = () => {
      const elapsedTime = (performance.now() - startTime) * 0.001;
      uniforms.u_time.value = elapsedTime;
      uniforms.u_audioAmp.value = getAudioAmp();
      uniforms.u_speakingState.value = statusRef.current === 'speaking' ? 1.0 : 0.0;

      mesh.rotation.y = elapsedTime * 0.15;
      mesh.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!parent) return;
      camera.aspect = parent.clientWidth / parent.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(parent.clientWidth, parent.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
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

