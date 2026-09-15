class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = options?.processorOptions?.sampleRate || 48000;
    this.chunkSeconds = options?.processorOptions?.chunkSeconds || 3;
    this.bufferSize = Math.floor(this.sampleRate * this.chunkSeconds);
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.bufferIndex++] = channelData[i];
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.buffer.slice(0, this.bufferSize));
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
