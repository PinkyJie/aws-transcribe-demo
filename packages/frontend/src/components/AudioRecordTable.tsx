import * as React from 'react';
import {
    Header,
    Form,
    Table,
    Segment,
    Container,
    Message,
    Popup,
    Button,
} from 'semantic-ui-react';
import axios from 'axios';

import { API_PATH_PREFIX } from '../constants';
import { getAudioType, getFileName } from '../utils';
import { AudioRecord, TranscriptionJSON } from '../types';

export interface AudioRecordTableProps {}

export interface AudioRecordTableState {
    searchText: string;
    searchResults: AudioRecord[];
    transcription?: TranscriptionJSON['results'];
}

export class AudioRecordTable extends React.Component<
    AudioRecordTableProps,
    AudioRecordTableState
> {
    constructor(props: AudioRecordTableProps) {
        super(props);
        this.state = {
            searchText: '',
            searchResults: [],
        };
    }

    public render() {
        const { searchText, searchResults, transcription } = this.state;
        return (
            <React.Fragment>
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
                            placeholder="Record ID"
                        />
                        <label>(leave empty to show all)</label>
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
                            {searchResults.map(result => this.getRow(result))}
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
            </React.Fragment>
        );
    }

    private getRow(result: AudioRecord) {
        const audioFileName = getFileName(result.audioUrl || '');
        return (
            <Table.Row key={result.id}>
                <Table.Cell>{result.id}</Table.Cell>
                <Table.Cell>{audioFileName}</Table.Cell>
                <Table.Cell>{result.status}</Table.Cell>
                <Table.Cell>
                    {result.audioUrl && (
                        <audio controls>
                            <source
                                src={`/${audioFileName}`}
                                type={getAudioType(audioFileName)}
                            />
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

    private handleSearch = () => {
        const { searchText } = this.state;
        axios
            .get<AudioRecord[]>(
                `/${API_PATH_PREFIX}/audios?recordId=${searchText || '*'}`
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
            const textFileName = getFileName(textUrl);
            axios.get<TranscriptionJSON>(`/${textFileName}`).then(result => {
                this.setState({
                    transcription: result.data.results,
                });
            });
        }
    }
}
