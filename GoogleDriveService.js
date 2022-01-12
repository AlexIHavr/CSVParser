import fs from 'fs';
import { google } from 'googleapis';

export class GoogleDriveService {
  constructor(clientId, clientSecret, redirectUri, refreshToken) {
    if (!clientId) throw new Error('Enter, please, clientId');
    if (!clientSecret) throw new Error('Enter, please, clientSecret');
    if (!redirectUri) redirectUri = 'https://developers.google.com/oauthplayground';
    if (!refreshToken) throw new Error('Enter, please, refreshToken');

    this.driveClient = this.createDriveClient(clientId, clientSecret, redirectUri, refreshToken);
  }

  createDriveClient(clientId, clientSecret, redirectUri, refreshToken) {
    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    client.setCredentials({ refresh_token: refreshToken });

    return google.drive({
      version: 'v3',
      auth: client,
    });
  }

  createFolder(folderName) {
    return this.driveClient.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, name',
    });
  }

  searchFolder(folderName) {
    return new Promise((resolve, reject) => {
      this.driveClient.files.list(
        {
          q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
          fields: 'files(id, name)',
        },
        (err, res) => {
          if (err) {
            return reject(err);
          }

          return resolve(res.data.files ? res.data.files[0] : null);
        }
      );
    });
  }

  async saveFile(fileName, filePath, fileMimeType) {
    let folder = await this.searchFolder(fileName).catch((error) => {
      console.error(error);
      return null;
    });

    if (!folder) {
      folder = await this.createFolder(fileName);
    }

    return this.driveClient.files.create({
      requestBody: {
        name: fileName,
        mimeType: fileMimeType,
        parents: folder.id ? [folder.id] : [],
      },
      media: {
        mimeType: fileMimeType,
        body: fs.createReadStream(filePath),
      },
    });
  }
}
