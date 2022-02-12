import fs from 'fs';
import getFilename from 'mvn-artifact-filename';
import parseName from 'mvn-artifact-name-parser';
import artifactUrl from 'mvn-artifact-url';
import fetch, { RequestInit } from 'node-fetch';
import path from 'path';

export interface Artifact {
  groupId: string;
  artifactId: string;
  version: string;
  extension?: string;
  classifier?: string;
  isSnapShot?: boolean;
  snapShotVersion?: string;
}

function pipeToFile(body: NodeJS.ReadableStream, destFile: string) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destFile);
    file.on('finish', () => {
      file.close();
      resolve(destFile);
    });
    file.on('error', (err) => {
      fs.unlink(destFile, function ignore() {});
      reject(err);
    });
    body.pipe(file);
  });
}

export default (async function download(
  artifact: Artifact | string,
  destination?: string,
  repository?: string,
  filename?: string,
  fetchOptions: RequestInit = {}
) {
  destination = destination || process.cwd();
  const artifactShape =
    typeof artifact === 'string' ? parseName(artifact) : artifact;

  const url = await artifactUrl(artifactShape, repository, fetchOptions);

  const destFile = path.join(
    destination || process.cwd(),
    filename || getFilename(artifactShape)
  );
  const response = await fetch(url, fetchOptions);
  if (response.status !== 200) {
    throw new Error(`Unable to fetch ${url}. Status ${response.status}`);
  }
  await pipeToFile(response.body, destFile);
  return destFile;
});
