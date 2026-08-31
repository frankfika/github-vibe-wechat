export type GenerationStage =
  | 'source'
  | 'rules'
  | 'waiting'
  | 'streaming'
  | 'checking'
  | 'done';

export type GenerationStreamEvent =
  | {
      type: 'stage';
      requestId: string;
      stage: GenerationStage;
      label: string;
      detail?: string;
      at: number;
    }
  | {
      type: 'delta';
      requestId: string;
      chars: number;
      preview: string;
      at: number;
    }
  | {
      type: 'done';
      requestId: string;
      md: string;
      title?: string;
      durationMs: number;
      issues: number;
      at: number;
    }
  | {
      type: 'error';
      requestId: string;
      message: string;
      retryable: boolean;
      at: number;
    };

export interface GenerationViewState {
  requestId: string;
  startedAt: number;
  stage: GenerationStage;
  label: string;
  detail?: string;
  chars: number;
  preview?: string;
  completed: GenerationStage[];
}

