export const FILE_EXT_REGEX = /^(.*)\.(mp3|MP3|wav|WAV)$/;

export function getFileName(fileUrl?: string) {
    if (fileUrl) {
        const parts = fileUrl.split('/');
        return parts[parts.length - 1];
    }
    return '';
}

export function getAudioType(fileName: string) {
    if (fileName) {
        const matches = fileName.match(FILE_EXT_REGEX);
        if (matches && matches[2]) {
            if (matches[2] === 'mp3') {
                return 'audio/mpeg';
            } else if (matches[2] === 'wav') {
                return 'audio/wav';
            }
        }
    }
    return '';
}
