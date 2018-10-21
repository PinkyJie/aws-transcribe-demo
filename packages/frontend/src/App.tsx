import * as React from 'react';
import { Header, Form, Table } from 'semantic-ui-react';

import './App.css';

class App extends React.Component {
    public render() {
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
                            />
                        </Form.Group>
                    </Form>
                    <Header as="h2">Check transcription status</Header>
                    <Form>
                        <Form.Group inline>
                            <Form.Input
                                icon={{
                                    name: 'search',
                                    circular: true,
                                    link: true,
                                }}
                                placeholder="Record id to search"
                            />
                        </Form.Group>
                    </Form>
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

                        <Table.Body />
                    </Table>
                </div>
            </div>
        );
    }
}

export default App;
