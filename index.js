import dotenv from 'dotenv';
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CSVTransformStream } from './CSVTransformStream.js';
import { GoogleDriveService } from './GoogleDriveService.js';

dotenv.config();

const googleDriveService = new GoogleDriveService(
  process.env.driveClientId,
  process.env.driveClientSecret,
  process.env.driveRedirectUri,
  process.env.driveRefreshToken
);

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
const separator = argv.separator;

const csvReadStream = fs.createReadStream(sourceFile, {
  encoding: 'utf8',
});
const csvWriteStream = fs.createWriteStream(resultFile);
const csvTransformStream = new CSVTransformStream(separator);

csvReadStream.pipe(csvTransformStream).pipe(csvWriteStream);

csvReadStream.on('end', () => {
  csvWriteStream.write(']');
  csvWriteStream.end();
});

csvWriteStream.on('finish', async () => {
  await loadJsonToGoogleDrive();
});

async function loadJsonToGoogleDrive() {
  await googleDriveService
    .saveFile('CSVParser', resultFile, 'application/json')
    .then(() => {
      console.info('File uploaded successfully!');
    })
    .catch((error) => {
      console.error(error);
    });
}

//generateBigCSV(2);
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
