declare module 'sox-audio' {
  export class SoxCommand {
      constructor();
      input(file: string): this;
      output(file: string): this;
      outputSampleRate(rate: number): this;
      outputChannels(channels: number): this;
      outputBits(bits: number): this;
      outputFileType(type: string): this;
      run(callback: (err: Error | null, stdout: string, stderr: string) => void): void;
  }

  // Add other exports from the sox-audio package as needed
}
