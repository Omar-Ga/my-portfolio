class PCMPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.port.onmessage = (event) => {
      if (event.data === 'clear') {
        this.buffer = [];
        return;
      }
      // ArrayBuffer of Int16 samples from main thread
      const pcm16 = new Int16Array(event.data);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 32768 : 32767);
      }
      this.buffer.push(...float32);
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const outputChannel = output[0];
    const framesNeeded = outputChannel.length;

    for (let i = 0; i < framesNeeded; i++) {
      outputChannel[i] = this.buffer.length > 0 ? this.buffer.shift() : 0;
    }

    // Mirror to mono or stereo channels if needed
    for (let channel = 1; channel < output.length; channel++) {
      output[channel].set(outputChannel);
    }

    return true;
  }
}

registerProcessor('pcm-playback-worklet', PCMPlaybackProcessor);
