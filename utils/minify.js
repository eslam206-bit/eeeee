const fs = require('fs');
const path = require('path');

function minifyText(content) {
    return content
        .replace(/\/\*[^]*?\*\//g, '')
        .replace(/\n+/g, '\n')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function minifyFile(filePath) {
    const absolute = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolute)) {
        return false;
    }

    const original = fs.readFileSync(absolute, 'utf8');
    const minified = minifyText(original);
    fs.writeFileSync(absolute, minified, 'utf8');
    return true;
}

module.exports = {
    minifyText,
    minifyFile
};
