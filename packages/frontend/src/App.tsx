import * as React from 'react';
import {
    Header,
    Form,
    Table,
    Button,
    Segment,
    Container,
    Message,
    Popup,
    Loader,
    Modal,
} from 'semantic-ui-react';
import axios from 'axios';
import { S3, STS, config, Credentials } from 'aws-sdk';

import './App.css';
import { AudioRecord, TranscriptionJSON } from './types';
import stackOutput from './stack.json';

export interface AppProps {}

export interface AppState {
    uploading: boolean;
    searchText: string;
    searchResults: AudioRecord[];
    transcription?: TranscriptionJSON['results'];
    showModal: boolean;
    modalHeader: string;
    modalContent: string;
}

export class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            showModal: false,
            modalHeader: '',
            modalContent: '',
            uploading: false,
            searchText: '',
            searchResults: [],
        };
    }

    public render() {
        const {
            uploading,
            searchText,
            searchResults,
            transcription,
            showModal,
            modalHeader,
            modalContent,
        } = this.state;
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">Voice Assist Demo</h1>
                </header>
                <div className="App-body">
                    <Header as="h2">Upload audio file</Header>
                    <Form>
                        <Form.Group inline>
                            <Form.Input
                                type="file"
                                label="Upload audio(*.mp3)"
                                onChange={this.handleFileUpload}
                            />
                            <Loader active={uploading} inline />
                        </Form.Group>
                    </Form>
                    <Header as="h2">Check transcription status</Header>
                    <Form>
                        <Form.Group inline>
                            <Form.Input
                                label="Search audio transcription status"
                                action={{
                                    color: 'teal',
                                    icon: 'search',
                                    content: 'Search',
                                    onClick: this.handleSearch,
                                }}
                                value={searchText}
                                onChange={this.handleSearchTextChange}
                                placeholder="Record id to search"
                            />
                        </Form.Group>
                    </Form>
                    {searchResults.length > 0 && (
                        <Table celled>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>ID</Table.HeaderCell>
                                    <Table.HeaderCell>
                                        Audio file name
                                    </Table.HeaderCell>
                                    <Table.HeaderCell>Status</Table.HeaderCell>
                                    <Table.HeaderCell>Audio</Table.HeaderCell>
                                    <Table.HeaderCell>Text</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {searchResults.map(result =>
                                    this.getRow(result)
                                )}
                            </Table.Body>
                        </Table>
                    )}
                    {transcription && (
                        <Segment>
                            <Container className="conversation">
                                {this.formatTranscription(transcription)}
                            </Container>
                        </Segment>
                    )}
                </div>
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
            </div>
        );
    }

    private getAudioFileName(audioUrl: string) {
        if (audioUrl) {
            const parts = audioUrl.split('/');
            return parts[parts.length - 1];
        }
        return '';
    }

    private getRow(result: AudioRecord) {
        return (
            <Table.Row key={result.id}>
                <Table.Cell>{result.id}</Table.Cell>
                <Table.Cell>
                    {this.getAudioFileName(result.audioUrl || '')}
                </Table.Cell>
                <Table.Cell>{result.status}</Table.Cell>
                <Table.Cell>
                    {result.audioUrl && (
                        <audio controls>
                            <source src={result.audioUrl} type="audio/mpeg" />
                        </audio>
                    )}
                </Table.Cell>
                <Table.Cell>
                    {result.textUrl && (
                        <Button
                            onClick={() =>
                                this.handleTextOpen(result.textUrl || '')
                            }
                        >
                            View
                        </Button>
                    )}
                </Table.Cell>
            </Table.Row>
        );
    }

    private formatTranscription(transcription: TranscriptionJSON['results']) {
        const words = transcription.items;
        let wordIndex = 0;
        const speakerSegments = transcription.speaker_labels.segments;
        return speakerSegments.map((segment, segmentIndex) => {
            let sentenceEndTime;
            if (segmentIndex < speakerSegments.length - 1) {
                sentenceEndTime = Number(
                    speakerSegments[segmentIndex + 1].start_time
                );
            } else {
                sentenceEndTime = Number(segment.end_time);
            }

            const contents = [];
            let shouldStop = false;
            while (!shouldStop) {
                const wordItem = words[wordIndex];
                if (
                    wordItem &&
                    (!wordItem.end_time ||
                        Number(wordItem.end_time) <= sentenceEndTime)
                ) {
                    wordIndex++;
                    const confidence = wordItem.alternatives[0].confidence;
                    const isPunctuation = confidence === null;
                    // put a space before every word except punctuation
                    const word = `${isPunctuation ? '' : ' '}${
                        wordItem.alternatives[0].content
                    }`;
                    if (isPunctuation) {
                        contents.push(<span>{word}</span>);
                    } else {
                        contents.push(
                            <Popup
                                trigger={<span className="word">{word}</span>}
                                content={`confidence: ${confidence}`}
                            />
                        );
                    }
                } else {
                    shouldStop = true;
                }
            }

            return (
                <Message
                    key={`segment_${segmentIndex}`}
                    color={segment.speaker_label === 'spk_0' ? 'teal' : 'blue'}
                    className={segment.speaker_label}
                    size="large"
                >
                    <Message.Header>{segment.speaker_label}</Message.Header>
                    <p>{...contents}</p>
                </Message>
            );
        });
    }

    private handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.persist();
        const files = e.target.files;
        if (files && files.length > 0) {
            if (!files[0].name.match(/\.mp3$/)) {
                this.setState({
                    showModal: true,
                    modalHeader: 'File format is not supported.',
                    modalContent: 'Please upload mp3 file only!',
                });
                return;
            }
            // get temporary token for S3 uploading
            axios
                .get<STS.Credentials>(`${stackOutput.ServiceEndpoint}/token`)
                .then(result => {
                    this.setState({
                        uploading: true,
                    });
                    config.credentials = new Credentials(
                        result.data.AccessKeyId,
                        result.data.SecretAccessKey,
                        result.data.SessionToken
                    );
                    const params = {
                        Body: files[0],
                        Bucket: stackOutput.AudioFileBucketName,
                        Key: files[0].name,
                        ServerSideEncryption: 'AES256',
                        ContentType: 'audio/mpeg',
                    };
                    const s3 = new S3();
                    s3.putObject(params)
                        .promise()
                        .then(() => {
                            this.setState({
                                showModal: true,
                                modalHeader: 'Uploading done!',
                                modalContent:
                                    'You can search below to track your audio transcription status.',
                            });
                            e.target.value = '';
                        })
                        .catch(() => {
                            this.setState({
                                showModal: true,
                                modalHeader: 'Uploading failed!',
                                modalContent: 'Please try again later.',
                            });
                            e.target.value = '';
                        });
                });
        }
    };

    private handleSearch = () => {
        const { searchText } = this.state;
        axios
            .get<AudioRecord[]>(
                `${stackOutput.ServiceEndpoint}/audios?recordId=${searchText ||
                    '*'}`
            )
            .then(results => {
                this.setState({ searchResults: results.data });
            });
    };

    private handleSearchTextChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const searchText = e.target.value;
        this.setState({
            searchText,
        });
    };

    private handleTextOpen(textUrl: string) {
        if (textUrl) {
            axios.get<TranscriptionJSON>(textUrl).then(result => {
                this.setState({
                    transcription: result.data.results,
                });
            });
        }
    }
}
