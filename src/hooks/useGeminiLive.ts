"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

export type LiveStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export interface GeminiLiveHook {
  status: LiveStatus;
  userTranscript: string;
  aiTranscript: string;
  errorMsg: string | null;
  getAudioAmp: () => number;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
}

export function useGeminiLive(): GeminiLiveHook {
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);
  const playbackWorkletRef = useRef<AudioWorkletNode | null>(null);

  const statusRef = useRef<LiveStatus>('idle');
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Calculate audio amplitude directly from AnalyserNodes without React state re-renders
  const getAudioAmp = useCallback(() => {
    let sum = 0;
    let count = 0;
    const currentStatus = statusRef.current;

    if (currentStatus === 'speaking' && speakerAnalyserRef.current) {
      const data = new Float32Array(speakerAnalyserRef.current.frequencyBinCount);
      speakerAnalyserRef.current.getFloatFrequencyData(data);
      for (let i = 0; i < data.length; i++) {
        const val = Math.max(0, (data[i] + 100) / 100);
        sum += val;
        count++;
      }
    } else if (currentStatus === 'listening' && micAnalyserRef.current) {
      const data = new Float32Array(micAnalyserRef.current.frequencyBinCount);
      micAnalyserRef.current.getFloatFrequencyData(data);
      for (let i = 0; i < data.length; i++) {
        const val = Math.max(0, (data[i] + 100) / 100);
        sum += val;
        count++;
      }
    }

    return count > 0 ? sum / count : 0.05;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    micAnalyserRef.current = null;
    speakerAnalyserRef.current = null;
    playbackWorkletRef.current = null;

    setStatus('idle');
  }, []);

  const connect = useCallback(async () => {
    try {
      setStatus('connecting');
      setErrorMsg(null);

      // 1. Fetch ephemeral token from server
      const tokenRes = await fetch('/api/token', { method: 'POST' });
      if (!tokenRes.ok) {
        const errJson = await tokenRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to fetch ephemeral token from server.');
      }
      const { token } = await tokenRes.json();

      // 2. Request mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 3. Initialize AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioCtxRef.current = audioCtx;

      // Load Worklets
      await audioCtx.audioWorklet.addModule('/worklets/pcm-capture-worklet.js');
      await audioCtx.audioWorklet.addModule('/worklets/pcm-playback-worklet.js');

      // Mic Analyser & Capture Worklet setup
      const micSource = audioCtx.createMediaStreamSource(stream);
      const micAnalyser = audioCtx.createAnalyser();
      micAnalyser.fftSize = 64;
      micSource.connect(micAnalyser);
      micAnalyserRef.current = micAnalyser;

      const captureWorklet = new AudioWorkletNode(audioCtx, 'pcm-capture-worklet');
      micSource.connect(captureWorklet);

      // Playback Worklet & Analyser setup
      const playbackWorklet = new AudioWorkletNode(audioCtx, 'pcm-playback-worklet');
      const speakerAnalyser = audioCtx.createAnalyser();
      speakerAnalyser.fftSize = 64;
      playbackWorklet.connect(speakerAnalyser);
      speakerAnalyser.connect(audioCtx.destination);
      speakerAnalyserRef.current = speakerAnalyser;
      playbackWorkletRef.current = playbackWorklet;

      // 4. Open Gemini Live WebSocket
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('listening');

        // Send setup payload matching constraints
        const setupMessage = {
          setup: {
            model: 'models/gemini-3.1-flash-live-preview',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Kore'
                  }
                }
              }
            }
          }
        };
        ws.send(JSON.stringify(setupMessage));
      };

      // Mic capture sending logic
      captureWorklet.port.onmessage = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          const arrayBuffer = event.data;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Audio = btoa(binary);

          ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64Audio
                }
              ]
            }
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          if (response.serverContent) {
            const serverContent = response.serverContent;

            if (serverContent.interrupted) {
              playbackWorklet.port.postMessage('clear');
              setStatus('listening');
            }

            // Audio output from model
            if (serverContent.modelTurn?.parts) {
              for (const part of serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  setStatus('speaking');
                  const binary = atob(part.inlineData.data);
                  const bytes = new Uint8Array(binary.length);
                  for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                  }
                  playbackWorklet.port.postMessage(bytes.buffer, [bytes.buffer]);
                }
              }
            }

            if (serverContent.turnComplete) {
              setStatus('listening');
            }

            // Transcriptions
            if (serverContent.inputTranscription?.text) {
              setUserTranscript(serverContent.inputTranscription.text);
            }
            if (serverContent.outputTranscription?.text) {
              setAiTranscript(prev => prev ? `${prev} ${serverContent.outputTranscription.text}` : serverContent.outputTranscription.text);
            }
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('Gemini Live WebSocket error:', e);
        setStatus('error');
        setErrorMsg('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log(`Gemini Live WebSocket closed (code: ${event.code}, reason: ${event.reason || 'None'})`);
        setStatus(prev => prev === 'error' ? 'error' : 'idle');
      };

    } catch (err: any) {
      console.error('Failed to connect to Gemini Live:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to initialize microphone or connection.');
      disconnect();
    }
  }, [disconnect]);

  const sendText = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setUserTranscript(text);
      setStatus('processing');
      wsRef.current.send(JSON.stringify({
        realtimeInput: {
          text
        }
      }));
    }
  }, []);

  return {
    status,
    userTranscript,
    aiTranscript,
    errorMsg,
    getAudioAmp,
    connect,
    disconnect,
    sendText
  };
}

