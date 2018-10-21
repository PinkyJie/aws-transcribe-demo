export enum AUDIO_PROCESS_STATUS {
    UPLOADED = 'Uploaded',
    PROCESSING = 'Processing',
    TRANSCRIBED = 'Transcribed',
    TRANSCRIBE_FAILED = 'TranscribeFailed',
}

export interface IAudioRecord {
    id: string;
    status: AUDIO_PROCESS_STATUS;
    audioUrl?: string;
    textUrl?: string;
    createdAt: number;
    updatedAt: number;
}
