import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { GoogleDriveService } from './GoogleDriveService.js';

const argv = yargs(hideBin(process.argv))
  .usage(
    'Usage: node $0 --sourceFile [sourceFile] --resultFile [resultFile] --separator [separator]'
  )
  .options({
    sourceFile: {
      type: 'string',
      description: 'Path of parsing file',
      demandOption: true,
    },
    resultFile: {
      type: 'string',
      description: 'Path of result file',
      demandOption: true,
    },
    separator: {
      type: 'string',
      default: ',',
      description: 'Symbol for parsing csv',
      demandOption: false,
    },
  }).argv;

const sourceFile = argv.sourceFile;
const resultFile = argv.resultFile;
let separator = argv.separator;

const readStream = fs.createReadStream(sourceFile, {
  encoding: 'utf8',
});
const writeStream = fs.createWriteStream(resultFile);

const sourceFileSize = fs.statSync(sourceFile).size;

let keys = [];
let readedDataSize = 0;
let hash = '';

readStream.on('data', (chunk) => {
  const lineEnding = chunk.includes('\r\n') ? '\r\n' : '\r';
  const chunkLines = (hash + chunk).split(lineEnding);

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
  loadJsonToGoogleDrive();
});

function loadJsonToGoogleDrive() {
  const driveClientId = '584137776274-24m6p0k02kcv3mtotpc3tellsi98s040.apps.googleusercontent.com';
  const driveClientSecret = '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';
  const driveRedirectUri = 'https://developers.google.com/oauthplayground';
  const driveRefreshToken =
    '1//04hW158zUFjvOCgYIARAAGAQSNwF-L9Ir02C9q3cZZWHCuHh511P9savs-6EcqBcFL48J6MN5uT7uOxgnh2Oj2OJXwIU0wboT3qw';

  (async () => {
    const googleDriveService = new GoogleDriveService(
      driveClientId,
      driveClientSecret,
      driveRedirectUri,
      driveRefreshToken
    );

    const folderName = 'CSVParser';

    let folder = await googleDriveService.searchFolder(folderName).catch((error) => {
      console.error(error);
      return null;
    });

    if (!folder) {
      folder = await googleDriveService.createFolder(folderName);
    }

    await googleDriveService
      .saveFile('CSVParser', resultFile, 'application/json', folder.id)
      .catch((error) => {
        console.error(error);
      });

    console.info('File uploaded successfully!');
  })();
}

// generateBigCSV(1000);
async function generateBigCSV(countIteration = 0) {
  const data = fs.readFileSync('testCSV.csv', {
    encoding: 'utf8',
  });

  const lineEnding = data.includes('\r\n') ? '\r\n' : '\r';

  const writeStream = fs.createWriteStream('testBigCSV.csv');
  writeStream.write(data);

  const dataForCopy = data.split(lineEnding).slice(1).join(lineEnding);
  for (let i = 0; i < countIteration; i++) {
    await new Promise((resolve) => {
      writeStream.write(lineEnding + dataForCopy, resolve);
    });
  }
}
