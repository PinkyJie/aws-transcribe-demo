import * as React from 'react';
import { Form, Button, Segment } from 'semantic-ui-react';

import { RECORD_STATUS } from '../types';

export interface RecordAudioProps {}

export interface RecordAudioState {
    recordStatus: RECORD_STATUS;
    recordedAudioURL: string;
}

export class RecordAudio extends React.Component<
    RecordAudioProps,
    RecordAudioState
> {
    private mediaRecorder: any;

    constructor(props: RecordAudioProps) {
        super(props);
        this.state = {
            recordStatus: RECORD_STATUS.DONE,
            recordedAudioURL: '',
        };
    }

    public render() {
        const { recordStatus, recordedAudioURL } = this.state;
        return (
            <React.Fragment>
                <Form>
                    <Form.Group>
                        <Form.Field label="or Record an audio in browser" />
                        <Button.Group>
                            <Button
                                color="green"
                                icon="circle"
                                content="Record"
                                disabled={recordStatus !== RECORD_STATUS.DONE}
                                onClick={this.startRecording}
                            />
                            {recordStatus !== RECORD_STATUS.PAUSED ? (
                                <Button
                                    color="grey"
                                    icon="pause"
                                    content="Pause"
                                    disabled={
                                        recordStatus !== RECORD_STATUS.RECORDING
                                    }
                                    onClick={this.pauseRecording}
                                />
                            ) : (
                                <Button
                                    color="yellow"
                                    content="Resume"
                                    disabled={
                                        recordStatus !== RECORD_STATUS.PAUSED
                                    }
                                    onClick={this.resumeRecording}
                                />
                            )}
                            <Button
                                color="red"
                                icon="square"
                                content="Stop"
                                disabled={recordStatus === RECORD_STATUS.DONE}
                                onClick={this.stopRecording}
                            />
                        </Button.Group>
                    </Form.Group>
                </Form>
                {recordedAudioURL && (
                    <Segment>
                        <audio controls>
                            <source src={recordedAudioURL} type="audio/wav" />
                        </audio>
                    </Segment>
                )}
            </React.Fragment>
        );
    }

    private startRecording = () => {
        this.setState({
            recordedAudioURL: '',
        });
        const recordData: Blob[] = [];
        if (!this.mediaRecorder) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then(stream => {
                    this.mediaRecorder = new (window as any).MediaRecorder(
                        stream
                    );
                    this.mediaRecorder.start();
                    this.setState({
                        recordStatus: RECORD_STATUS.RECORDING,
                    });

                    this.mediaRecorder.addEventListener(
                        'dataavailable',
                        (event: any) => {
                            recordData.push(event.data);
                        }
                    );
                    this.mediaRecorder.addEventListener(
                        'stop',
                        (event: any) => {
                            const audioBlob = new Blob(recordData, {
                                type: 'audio/wav',
                            });
                            const audioUrl = URL.createObjectURL(audioBlob);
                            this.setState({
                                recordedAudioURL: audioUrl,
                            });
                        }
                    );
                });
        }
    };

    private pauseRecording = () => {
        if (this.mediaRecorder) {
            this.mediaRecorder.pause();
            this.setState({
                recordStatus: RECORD_STATUS.PAUSED,
            });
        }
    };

    private resumeRecording = () => {
        if (this.mediaRecorder) {
            this.mediaRecorder.resume();
            this.setState({
                recordStatus: RECORD_STATUS.RECORDING,
            });
        }
    };

    private stopRecording = () => {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.setState({
                recordStatus: RECORD_STATUS.DONE,
            });
        }
    };
}
