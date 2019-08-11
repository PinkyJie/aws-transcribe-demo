import * as React from 'react';
import { Header, Form, Modal } from 'semantic-ui-react';
import axios from 'axios';
import { S3 } from 'aws-sdk';

import { API_PATH_PREFIX } from '../constants';
import { getAudioType, FILE_EXT_REGEX } from '../utils';
import { RecordAudio } from './RecordAudio';

const SPEAKERS_COUNT_OPTIONS: Array<{
    key: string;
    value: string;
    text: string;
}> = [];
for (let i = 2; i <= 10; i++) {
    SPEAKERS_COUNT_OPTIONS.push({
        key: i.toString(),
        value: i.toString(),
        text: i.toString(),
    });
}

export interface UploadAudioProps {}

export interface UploadAudioState {
    uploading: boolean;
    showModal: boolean;
    modalHeader: string;
    modalContent: string;
    speakerCount: number;
}

export class UploadAudio extends React.Component<
    UploadAudioProps,
    UploadAudioState
> {
    constructor(props: UploadAudioProps) {
        super(props);
        this.state = {
            uploading: false,
            showModal: false,
            modalHeader: '',
            modalContent: '',
            speakerCount: 2,
        };
    }

    public render() {
        const { uploading, showModal, modalHeader, modalContent } = this.state;
        return (
            <React.Fragment>
                <Header as="h2">Upload audio file</Header>
                <Form loading={uploading}>
                    <Form.Group inline>
                        <Form.Select
                            label="How many speakers (max)?"
                            options={SPEAKERS_COUNT_OPTIONS}
                            onChange={this.handleSpeakerCountChange}
                            value={this.state.speakerCount.toString()}
                        />
                    </Form.Group>
                    <Form.Group inline>
                        <Form.Input
                            type="file"
                            label="Select audio from local(*.mp3/wav)"
                            onChange={this.handleFileUpload}
                        />
                    </Form.Group>
                </Form>
                <RecordAudio />
                <Modal
                    open={showModal}
                    header={modalHeader}
                    content={modalContent}
                    actions={[
                        {
                            key: 'done',
                            content: 'OK',
                            positive: true,
                            onClick: () => {
                                this.setState({
                                    showModal: false,
                                    uploading: false,
                                });
                            },
                        },
                    ]}
                />
            </React.Fragment>
        );
    }

    private handleSpeakerCountChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
        data: { value: string }
    ) => {
        this.setState({
            speakerCount: Number(data.value),
        });
    };

    private handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const matches = files[0].name.match(FILE_EXT_REGEX);
            if (!matches) {
                this.setState({
                    showModal: true,
                    modalHeader: 'File format is not supported.',
                    modalContent: 'Please upload mp3/wav file only!',
                });
                return;
            }
            // add timestamp to prevent duplicate files
            const fileName = `${matches[1]}_${+new Date()}_SPEAKER${
                this.state.speakerCount
            }.${matches[2]}`;
            // get temporary token for S3 uploading
            return axios
                .get<S3.PresignedPost>(
                    `/${API_PATH_PREFIX}/token?key=${fileName}&type=${getAudioType(
                        fileName
                    )}`
                )
                .then(result => {
                    this.setState({
                        uploading: true,
                    });
                    const formData = new FormData();
                    Object.keys(result.data.fields).forEach(fieldName => {
                        formData.set(fieldName, result.data.fields[fieldName]);
                    });
                    formData.append('file', files[0]);

                    return axios
                        .post(result.data.url, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        })
                        .then(() => {
                            this.setState({
                                showModal: true,
                                modalHeader: 'Uploading done!',
                                modalContent:
                                    'You can search below to track your audio transcription status.',
                            });
                        })
                        .catch(() => {
                            this.setState({
                                showModal: true,
                                modalHeader: 'Uploading failed!',
                                modalContent: 'Please try again later.',
                            });
                        });
                });
        }
        return Promise.resolve();
    };
}
