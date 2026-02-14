require('dotenv').config();

const fs = require('fs');
const path = require('path');
const dataService = require('../services/dataService');

function ensureBackupDir() {
    const backupDir = path.resolve(process.cwd(), 'data', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    return backupDir;
}

function copyDbFile(backupDir, timestamp) {
    const dbPath = process.env.DB_PATH
        ? path.resolve(process.cwd(), process.env.DB_PATH)
        : path.resolve(process.cwd(), 'database', 'hos.db');

    if (!fs.existsSync(dbPath)) {
        return null;
    }

    const dbBackupPath = path.join(backupDir, `hos-${timestamp}.db`);
    fs.copyFileSync(dbPath, dbBackupPath);
    return dbBackupPath;
}

async function runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = ensureBackupDir();

    const data = await dataService.exportAllData();
    const jsonBackupPath = path.join(backupDir, `hos-${timestamp}.json`);
    fs.writeFileSync(jsonBackupPath, JSON.stringify(data, null, 2), 'utf8');

    const dbBackupPath = copyDbFile(backupDir, timestamp);

    console.log(`JSON backup created: ${jsonBackupPath}`);
    if (dbBackupPath) {
        console.log(`DB backup created: ${dbBackupPath}`);
    }
}

runBackup().then(() => process.exit(0)).catch(err => {
    console.error('Backup failed', err);
    process.exit(1);
});
