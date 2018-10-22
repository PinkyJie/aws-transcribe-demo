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
} from 'semantic-ui-react';
import axios from 'axios';

import './App.css';
import { AudioRecord, TranscriptionJSON } from './types';

export interface AppProps {}

export interface AppState {
    searchText: string;
    searchResults: AudioRecord[];
    transcription?: TranscriptionJSON['results'];
}

const URL = 'https://rs010w8d4d.execute-api.ap-southeast-2.amazonaws.com/dev';

export class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            searchText: '',
            searchResults: [],
        };
    }

    public render() {
        const { searchText, searchResults, transcription } = this.state;
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
                        </Form.Group>
                    </Form>
                    <Header as="h2">Check transcription status</Header>
                    <Form>
                        <Form.Group inline>
                            <Form.Input
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
        console.log(e.target.files);
    };

    private handleSearch = () => {
        const { searchText } = this.state;
        axios
            .get<AudioRecord[]>(`${URL}/audios?recordId=${searchText || '*'}`)
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
