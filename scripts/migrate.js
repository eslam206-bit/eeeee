require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { initializeDatabase } = require('../database/init');
const dataService = require('../services/dataService');

function backupJsonFiles() {
    const dataDir = path.resolve(process.cwd(), 'data');
    const backupDir = path.resolve(process.cwd(), 'data', `backup-${Date.now()}`);

    if (!fs.existsSync(dataDir)) {
        return null;
    }

    fs.mkdirSync(backupDir, { recursive: true });

    const candidates = ['members.json', 'admin.json'];
    for (const fileName of candidates) {
        const src = path.join(dataDir, fileName);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(backupDir, fileName));
        }
    }

    return backupDir;
}

function runMigration() {
    const backupPath = backupJsonFiles();
    (async () => {
        await initializeDatabase();
        const exported = await dataService.exportAllData();

        console.log('Migration completed successfully.');
        if (backupPath) {
            console.log(`JSON backup created at: ${backupPath}`);
        }
        console.log(`Members in DB: ${exported.members.length}`);
    })().catch(err => {
        console.error('Migration failed', err);
        process.exit(1);
    });
}

runMigration();
