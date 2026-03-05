#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INBOX_DIR = path.join(__dirname, '../agent_inbox');
const OUTBOX_DIR = path.join(__dirname, '../agent_outbox');

console.log('\n🤖 ARES Agent Connector Started');
console.log(`Listening for tasks in: ${INBOX_DIR}`);

// Ensure folders exist
if (!fs.existsSync(INBOX_DIR)) fs.mkdirSync(INBOX_DIR, { recursive: true });
if (!fs.existsSync(OUTBOX_DIR)) fs.mkdirSync(OUTBOX_DIR, { recursive: true });

const processTask = (filename) => {
    const filePath = path.join(INBOX_DIR, filename);
    if (!fs.existsSync(filePath)) return;

    console.log(`\n🔔 Processing Task: ${filename}`);
    console.log('Handing off to Claude Code...\n');

    try {
        // Run Claude Code and tell it to process the file
        const command = `claude "Read and execute the task instructions in ${filePath}. When finished, create a summary file in ${OUTBOX_DIR} named ${filename.replace('.md', '_complete.md')} detailing what you did."`;

        // stdio hook lets us see Claude's output stream
        execSync(command, { stdio: 'inherit' });

        // Move the processed task to an archive folder after successful execution
        const archiveDir = path.join(INBOX_DIR, 'archive');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);
        fs.renameSync(filePath, path.join(archiveDir, filename));

        console.log(`\n✅ Task ${filename} completed and archived.`);
    } catch (error) {
        console.error(`\n❌ Error processing ${filename}:`, error.message);
    }
};

// 1. Process any files already sitting in the inbox on startup
const existingFiles = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.md'));
if (existingFiles.length > 0) {
    console.log(`\n📦 Found ${existingFiles.length} existing task(s) in inbox, processing immediately...`);
    existingFiles.forEach(processTask);
} else {
    console.log('\n⏳ Waiting for tasks...');
}

// 2. Watch for new tasks
fs.watch(INBOX_DIR, (eventType, filename) => {
    // macOS emits 'rename' for creation events
    if (eventType === 'rename' && filename && filename.endsWith('.md')) {
        // Only process if it wasn't a deletion
        if (fs.existsSync(path.join(INBOX_DIR, filename))) {
            processTask(filename);
        }
    }
});
