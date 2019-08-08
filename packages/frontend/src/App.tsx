import * as React from 'react';

import './App.css';
import { UploadAudio } from './components/UploadAudio';
import { AudioRecordTable } from './components/AudioRecordTable';

export function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1 className="App-title">AWS Transcribe Demo</h1>
            </header>
            <div className="App-body">
                <UploadAudio />
                <AudioRecordTable />
            </div>
        </div>
    );
}
