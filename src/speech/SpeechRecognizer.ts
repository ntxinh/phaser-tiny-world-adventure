export function matchesTarget(
  results: SpeechRecognitionResult,
  target: string,
  threshold: number,
): boolean {
  return Array.from(results).some(
    r => r.confidence >= threshold && r.transcript.toLowerCase().includes(target.toLowerCase()),
  );
}

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;

  isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  startListening(target: string, onPass: () => void, onFail: () => void): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      onFail();
      return;
    }

    this.recognition = new SR() as SpeechRecognition;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const matched = matchesTarget(event.results[0], target, 0.4);
      matched ? onPass() : onFail();
    };

    this.recognition.onerror = () => onFail();
    this.recognition.onend = () => { this.recognition = null; };
    this.recognition.start();
  }

  stopListening(): void {
    this.recognition?.abort();
    this.recognition = null;
  }
}
