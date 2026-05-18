/**
 * Web Speech API type definitions
 * These are partially missing from TypeScript's DOM lib in some versions
 */

interface SpeechRecognitionEventInit extends EventInit {
  results: SpeechRecognitionResultList;
  resultIndex?: number;
  interpretation?: any;
  emma?: Document;
}

declare class SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
  readonly interpretation: any;
  readonly emma?: Document;
  constructor(type: string, eventInitDict?: SpeechRecognitionEventInit);
}

interface SpeechRecognitionErrorEventInit extends EventInit {
  error: SpeechRecognitionErrorCode;
}

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'network-error';

declare class SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  constructor(type: string, eventInitDict?: SpeechRecognitionErrorEventInit);
}

interface SpeechRecognitionEventMap {
  audioend: Event;
  audiostart: Event;
  end: Event;
  error: SpeechRecognitionErrorEvent;
  nomatch: SpeechRecognitionEvent;
  result: SpeechRecognitionEvent;
  soundend: Event;
  soundstart: Event;
  speechend: Event;
  speechstart: Event;
  start: Event;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof webkitSpeechRecognition;
}
