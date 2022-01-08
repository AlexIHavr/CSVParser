import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv)).argv;

const sourceFile = argv.sourceFile;
const resultFile = argv.resultFile;
let separator = argv.separator;

checkArgvErrors();

const readStream = fs.createReadStream(sourceFile, {
  encoding: 'utf8',
});
const writeStream = fs.createWriteStream(resultFile);

const sourceFileSize = fs.statSync(sourceFile).size;

let keys = [];
let readedDataSize = 0;
let hash = '';

readStream.on('data', (chunk) => {
  const chunkLines = (hash + chunk).split('\r\n');

  hash = chunkLines.splice(-1, 1)[0];

  if (!chunkLines.length) throw new Error('Invalid csv file.');

  if (!keys.length) {
    keys = chunkLines[0].split(separator);

    if (!keys.length) throw new Error('Invalid separator.');
    chunkLines.shift();
    writeStream.write('[');
  }

  readedDataSize += chunk.length;

  chunkLines.forEach((line, iChunk) => {
    const splitedLine = line.split(separator);

    console.log(keys, splitedLine);

    if (keys.length !== splitedLine.length) {
      fs.unlinkSync(resultFile);
      throw new Error('Invalid csv file.');
    }

    const linesJson = splitedLine.reduce((lineJson, currentValue, i) => {
      lineJson[keys[i]] = currentValue;
      return lineJson;
    }, {});

    let coma = ',';
    if (sourceFileSize === readedDataSize && iChunk === chunkLines.length - 1) {
      coma = '';
    }

    writeStream.write(JSON.stringify(linesJson) + coma);
  });
});

readStream.on('end', () => {
  writeStream.write(']');
});

function checkArgvErrors() {
  if (typeof sourceFile !== 'string') throw new Error('Enter, please, sourceFile.');
  if (typeof resultFile !== 'string') throw new Error('Enter, please, resultFile.');
  if (!/^[0-9a-z.,_-]+\.[a-z]+$/i.test(resultFile) && resultFile.length <= 255)
    throw new Error('Invalid resultFile name.');
  if (separator === true) throw new Error('Invalid separator.');
  if (!separator) separator = ',';
}

// generateBigCSV(2);
function generateBigCSV(countIteration = 0) {
  const data = fs.readFileSync('testCSV.csv', {
    encoding: 'utf8',
  });

  const writeStream = fs.createWriteStream('testBigCSV.csv');
  writeStream.write(data);

  const dataForCopy = data.split('\r\n').slice(1).join('\r\n');
  for (let i = 0; i < countIteration; i++) {
    writeStream.write('\r\n' + dataForCopy);
  }
}
