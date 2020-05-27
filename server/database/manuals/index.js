const fs = require('fs');
const path = require('path');

const pages = {};

const files = fs.readdirSync(__dirname);
for(let fileName of files.filter(file => file.endsWith('.md'))){
  try {
    const {name} = path.parse(fileName);
    pages[name] = fs.readFileSync(path.resolve(__dirname, fileName));
    pages[name] = pages[name].toString('utf8');
  } catch (e) {
    console.error(e);
  }
}

module.exports = pages;