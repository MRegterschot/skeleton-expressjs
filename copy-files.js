const fs = require('fs-extra');

const foldersToCopy = [
  { source: './templates', destination: './dist/templates' },
];

console.log('Copying folders...');
foldersToCopy.forEach((folder) => {
  try {
    fs.copySync(folder.source, folder.destination);
    console.log(`Copied ${folder.source} to ${folder.destination}`);
  } catch (err) {
    console.error(`Error copying ${folder.source}:`, err);
  }
});

console.log('Done copying over files! Ready to rock \'n roll')