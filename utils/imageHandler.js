const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const photosDir = path.resolve(process.cwd(), 'uploads', 'photos');

function ensurePhotosDir() {
    if (!fs.existsSync(photosDir)) {
        fs.mkdirSync(photosDir, { recursive: true });
    }
}

function generateUniqueFileName(ext) {
    const token = crypto.randomBytes(12).toString('hex');
    return `${Date.now()}-${token}.${ext}`;
}

function saveBase64Image(base64Image) {
    ensurePhotosDir();

    const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i.exec(base64Image);
    if (!match) {
        throw new Error('Invalid image format');
    }

    const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const fileName = generateUniqueFileName(extension);
    const relativePath = path.join('uploads', 'photos', fileName).replace(/\\/g, '/');
    const absolutePath = path.resolve(process.cwd(), relativePath);

    const buffer = Buffer.from(match[2], 'base64');
    fs.writeFileSync(absolutePath, buffer);

    return `/${relativePath}`;
}

function removePhoto(photoPath) {
    if (!photoPath || !photoPath.startsWith('/uploads/photos/')) {
        return;
    }

    const absolutePath = path.resolve(process.cwd(), photoPath.replace(/^\//, ''));
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
}

module.exports = {
    saveBase64Image,
    generateUniqueFileName,
    removePhoto
};
