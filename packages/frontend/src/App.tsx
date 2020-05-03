import * as React from 'react';

import './App.css';
import { AudioRecordTable } from './components/AudioRecordTable';

export function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1 className="App-title">AWS Transcribe Demo</h1>
            </header>
            <div className="App-body">
                <p>Too much cost, no more uploading</p>
                <AudioRecordTable />
            </div>
        </div>
    );
}
