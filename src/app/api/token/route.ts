import { NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

const SYSTEM_PROMPT = `You are Omar's AI representative on his personal portfolio website.
Omar is a senior full-stack engineer and technical architect specializing in Next.js, WebGL, GSAP, Turso/LibSQL, and AI-driven platforms.
He builds high-performance web applications, local-first offline engines, and AI systems.
Be warm, professional, concise, and helpful. Speak in clear, natural sentences suitable for a live voice conversation.
If visitors ask about hiring Omar, rates, or availability, give a brief overview of his capabilities and invite them to reach out directly using the site's contact options.`;

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY environment variable is not set.' },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: 'models/gemini-3.1-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Kore' // Prebuilt female voice
                }
              }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          }
        },
        httpOptions: {
          apiVersion: 'v1alpha'
        }
      }
    });

    return NextResponse.json({ token: token.name });
  } catch (err: any) {
    console.error('Error creating ephemeral token:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create ephemeral token' },
      { status: 500 }
    );
  }
}
