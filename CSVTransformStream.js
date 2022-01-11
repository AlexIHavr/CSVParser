import { Stream } from 'stream';
import fs from 'fs';

export class CSVTransformStream extends Stream.Transform {
  constructor(sourceFile, separator) {
    super();

    this.keys = [];
    this.readedDataSize = 0;
    this.hash = '';
    this.sourceFileSize = fs.statSync(sourceFile).size;
    this.separator = separator;
  }

  _transform(chunk, _, callback) {
    let changedChunk = '';
    const lineEnding = chunk.includes('\r\n') ? '\r\n' : '\r';
    const chunkLines = (this.hash + chunk).split(lineEnding);

    this.hash = chunkLines.pop();

    if (chunkLines.length === 1) throw new Error('Invalid csv file.');

    if (!this.keys.length) {
      this.keys = chunkLines[0].split(this.separator);

      chunkLines.shift();
      changedChunk += '[';
    }

    this.readedDataSize += chunk.length;

    chunkLines.forEach((line, chunkIndex) => {
      const splitedLine = line.split(this.separator);

      if (this.keys.length !== splitedLine.length) {
        fs.rmSync(resultFile);
        throw new Error('Invalid csv file.');
      }

      const linesJson = splitedLine.reduce((lineJson, currentValue, i) => {
        lineJson[this.keys[i]] = currentValue;
        return lineJson;
      }, {});

      let coma = ',';
      if (this.sourceFileSize === this.readedDataSize && chunkIndex === chunkLines.length - 1) {
        coma = '';
      }

      changedChunk += JSON.stringify(linesJson) + coma;
    });

    callback(null, changedChunk);
  }
}
