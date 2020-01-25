export enum AUDIO_PROCESS_STATUS {
    UPLOADED = 'Uploaded',
    PROCESSING = 'Processing',
    TRANSCRIBED = 'Transcribed',
    TRANSCRIBE_FAILED = 'TranscribeFailed',
}

export enum RECORD_STATUS {
    RECORDING = 'Recording',
    PAUSED = 'Paused',
    DONE = 'Done',
}

export interface AudioRecord {
    id: string;
    status: AUDIO_PROCESS_STATUS;
    audioUrl?: string;
    textUrl?: string;
    error?: string;
    speakers?: number;
    createdAt: number;
    updatedAt: number;
}

export interface SpeakerSegment {
    start_time: string;
    speaker_label: string;
    end_time: string;
}

export interface TranscriptionJSON {
    jobName: string;
    accountId: number;
    status: string;
    results: {
        transcripts: { transcript: string }[];
        speaker_labels: {
            speakers: number;
            segments: (SpeakerSegment & {
                items: SpeakerSegment[];
            })[];
        };
        items: {
            start_time?: string;
            end_time?: string;
            type: string;
            alternatives: {
                confidence: string | null;
                content: string;
            }[];
        }[];
    };
}
