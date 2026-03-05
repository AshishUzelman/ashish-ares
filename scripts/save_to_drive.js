#!/usr/bin/env node
/**
 * ARES Save to Drive
 *
 * Two-part backup:
 *  1. Write session_summary to Firestore memory collection (immediate — always runs)
 *  2. Scaffold for Google Drive API (requires OAuth setup — see TODO below)
 *
 * Usage:
 *   node save_to_drive.js [--summary "optional summary text"]
 *
 * Drive folder: 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1
 */

const fs   = require('fs')
const path = require('path')
const { writeSessionSummary, getRecentMemory } = require('./firestore-client')

const DRIVE_FOLDER_ID = '15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1'
const RHM_ROOT = path.join(__dirname, '../../')

// --- CLI arg parsing ------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2)
  let summary = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--summary' && args[i + 1]) {
      summary = args[++i]
    }
  }
  return { summary }
}

// --- Part 1: Firestore memory record --------------------------------------

async function writeToFirestore(summaryText) {
  console.log('[save_to_drive] Writing session_summary to Firestore...')
  try {
    // Pull recent memory to build a snapshot of active rules
    const records = await getRecentMemory(50)
    const activeRules = records
      .filter((r) => r.type === 'learned_rule' && !r.archivedAt)
      .map((r) => r.rule || r.content || r.id)

    await writeSessionSummary({
      summary: summaryText || `Session save — ${new Date().toISOString()}`,
      activeRuleCount: activeRules.length,
      activeRules,
      savedBy: 'save_to_drive.js',
    })
    console.log('[save_to_drive] ✅ session_summary written to Firestore memory collection')
    return true
  } catch (err) {
    console.error('[save_to_drive] ❌ Firestore write failed:', err.message)
    return false
  }
}

// --- Part 2: Google Drive upload ------------------------------------------

async function uploadToDrive(summaryText) {
  // TODO: OAuth2 setup required before this runs.
  //
  // Steps to activate:
  //  1. Go to Google Cloud Console → APIs & Services → Credentials
  //  2. Create OAuth 2.0 Client ID (Desktop app)
  //  3. Download credentials.json → save to ares/scripts/drive_credentials.json
  //  4. Run: node scripts/drive_auth.js  (creates token.json)
  //  5. Uncomment the upload code below
  //
  // Required package: npm install googleapis (in ares/)

  const credPath = path.join(__dirname, 'drive_credentials.json')
  if (!fs.existsSync(credPath)) {
    console.log('[save_to_drive] ℹ️  Drive upload skipped — drive_credentials.json not found.')
    console.log(`    Target folder: ${DRIVE_FOLDER_ID}`)
    console.log('    See TODO in save_to_drive.js to set up OAuth.')
    return false
  }

  // --- Activate when OAuth is ready ---
  // const { google } = require('googleapis')
  // const { readFileSync } = require('fs')
  //
  // const credentials = JSON.parse(readFileSync(credPath))
  // const token = JSON.parse(readFileSync(path.join(__dirname, 'drive_token.json')))
  // const { client_secret, client_id, redirect_uris } = credentials.installed
  // const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
  // auth.setCredentials(token)
  //
  // const drive = google.drive({ version: 'v3', auth })
  // const content = buildSessionContent(summaryText)
  // const fileName = `ARES_session_${new Date().toISOString().slice(0,10)}.md`
  //
  // await drive.files.create({
  //   requestBody: { name: fileName, mimeType: 'text/markdown', parents: [DRIVE_FOLDER_ID] },
  //   media: { mimeType: 'text/markdown', body: content },
  // })
  // console.log(`[save_to_drive] ✅ Uploaded ${fileName} to Drive folder ${DRIVE_FOLDER_ID}`)
  // return true

  return false
}

// --- Memory file snapshot for Drive upload --------------------------------

function buildSessionContent(summaryText) {
  const lines = [
    `# ARES Session Summary`,
    `Date: ${new Date().toISOString()}`,
    '',
    `## Summary`,
    summaryText || '(auto-save)',
    '',
    `## Memory Files Snapshot`,
  ]

  const memoryFiles = ['SOUL_BASE.md', 'SOUL_ARES.md', 'SOUL.md', 'CONTEXT.md', 'rolling_summary.md']
  for (const name of memoryFiles) {
    const filePath = path.join(RHM_ROOT, name)
    if (fs.existsSync(filePath)) {
      lines.push(`\n---\n### ${name}\n`)
      lines.push(fs.readFileSync(filePath, 'utf8'))
    }
  }

  return lines.join('\n')
}

// --- Entry point ----------------------------------------------------------

async function run() {
  const { summary } = parseArgs()
  console.log('\n[save_to_drive] Starting backup...')

  const firestoreOk = await writeToFirestore(summary)
  await uploadToDrive(summary)

  if (firestoreOk) {
    console.log('[save_to_drive] Backup complete.\n')
    process.exit(0)
  } else {
    console.error('[save_to_drive] Backup incomplete — check errors above.\n')
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('[save_to_drive] Fatal error:', err)
  process.exit(1)
})
