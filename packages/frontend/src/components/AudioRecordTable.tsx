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
    Modal,
} from 'semantic-ui-react';
import axios from 'axios';

import {
    API_PATH_PREFIX,
    TRANSCRIBED_TEXT_FILE_URL_PREFIX,
    AUDIO_FILE_URL_PREFIX,
} from '../constants';
import { getAudioType, getFileName } from '../utils';
import { AudioRecord, TranscriptionJSON, AUDIO_PROCESS_STATUS } from '../types';

const SPEAKER_COLORS = [
    'teal',
    'blue',
    'orange',
    'yellow',
    'green',
    'violet',
    'purple',
    'pink',
    'brown',
];

export interface AudioRecordTableProps {}

export interface AudioRecordTableState {
    searchText: string;
    searchResults: AudioRecord[];
    /** the audio file whose transcription is opened */
    activeAudioFile?: string;
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
        const {
            searchText,
            searchResults,
            transcription,
            activeAudioFile,
        } = this.state;
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
                            {searchResults
                                .sort((a, b) => b.updatedAt - a.updatedAt)
                                .map(result => this.getRow(result))}
                        </Table.Body>
                    </Table>
                )}
                <Modal
                    open={!!transcription}
                    centered={false}
                    onClose={this.handleModalClose}
                    closeIcon
                >
                    <Modal.Header>{`Transcription for ${activeAudioFile}`}</Modal.Header>
                    <Modal.Content>
                        <Container className="conversation">
                            {this.formatTranscription(transcription)}
                        </Container>
                    </Modal.Content>
                </Modal>
            </React.Fragment>
        );
    }

    private getRow(result: AudioRecord) {
        const audioFileName = getFileName(result.audioUrl || '');
        return (
            <Table.Row key={result.id}>
                <Table.Cell>{result.id}</Table.Cell>
                <Table.Cell>{audioFileName}</Table.Cell>
                <Table.Cell>
                    {result.status ===
                    AUDIO_PROCESS_STATUS.TRANSCRIBE_FAILED ? (
                        <Popup
                            trigger={
                                <span className="error-status">
                                    {result.status}
                                </span>
                            }
                            content={result.error}
                        />
                    ) : (
                        result.status
                    )}
                </Table.Cell>
                <Table.Cell>
                    {result.audioUrl && (
                        <audio controls>
                            <source
                                src={`/${AUDIO_FILE_URL_PREFIX}/${audioFileName}`}
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
        if (!transcription) {
            return null;
        }
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
                    color={
                        SPEAKER_COLORS[
                            segment.speaker_label.replace('spk_', '')
                        ]
                    }
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
            axios
                .get<TranscriptionJSON>(
                    `/${TRANSCRIBED_TEXT_FILE_URL_PREFIX}/${textFileName}`
                )
                .then(result => {
                    this.setState({
                        transcription: result.data.results,
                    });
                });
        }
    }

    private handleModalClose = () => {
        this.setState({
            transcription: undefined,
        });
    };
}
