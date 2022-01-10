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

  hash = chunkLines.pop();

  if (chunkLines.length === 1) throw new Error('Invalid csv file.');

  if (!keys.length) {
    keys = chunkLines[0].split(separator);

    chunkLines.shift();
    writeStream.write('[');
  }

  readedDataSize += chunk.length;

  chunkLines.forEach((line, iChunk) => {
    const splitedLine = line.split(separator);

    if (keys.length !== splitedLine.length) {
      fs.rmSync(resultFile);
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
  if (separator === true) throw new Error('Invalid separator.');
  if (!separator) separator = ',';
}

// generateBigCSV(10000);
async function generateBigCSV(countIteration = 0) {
  const data = fs.readFileSync('testCSV.csv', {
    encoding: 'utf8',
  });

  const writeStream = fs.createWriteStream('testBigCSV.csv');
  writeStream.write(data);

  const dataForCopy = data.split('\r\n').slice(1).join('\r\n');
  for await (let i of writeDataToBigCSV(writeStream, countIteration, dataForCopy));
}

async function* writeDataToBigCSV(writeStream, countIteration, data) {
  for (let i = 0; i < countIteration; i++) {
    yield writeStream.write('\r\n' + data);
  }
}
