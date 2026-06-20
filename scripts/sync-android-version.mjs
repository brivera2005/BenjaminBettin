import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const release = JSON.parse(readFileSync(join(root, 'mobile/release.json'), 'utf8'));
const gradlePath = join(root, 'android/app/build.gradle');
let gradle = readFileSync(gradlePath, 'utf8');

gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${release.versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${release.versionName}"`);

writeFileSync(gradlePath, gradle);
console.log(`Synced Android version to ${release.versionName} (${release.versionCode})`);
