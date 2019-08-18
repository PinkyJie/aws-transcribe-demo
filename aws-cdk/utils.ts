import crypto = require('crypto');
import fs = require('fs');

export function getFileHash(filePath: string) {
    const modifyS3PathFuncContent = fs.readFileSync(filePath);
    return crypto
        .createHash('sha256')
        .update(modifyS3PathFuncContent)
        .digest('base64');
}
