#!/usr/bin/env node
/**
 * ARES Context Loader
 * Builds an Agent Context Packet for Claude to consume at task start.
 *
 * Packet contains:
 *  1. Soul files (identity + rules)
 *  2. Recent memory records from Firestore (learned rules + last session summary)
 *  3. Current agent states
 *  4. Working files summary (what's in agent_inbox / agent_outbox)
 */

const fs = require('fs')
const path = require('path')
const { getDb, getRecentMemory, getBackupStatus } = require('./firestore-client')

// RHM root is two levels up from scripts/
const RHM_ROOT = path.join(__dirname, '../../')
const ARES_ROOT = path.join(__dirname, '../')

const SOUL_FILES = [
  { name: 'SOUL_BASE.md', label: 'Base Rules' },
  { name: 'SOUL_ARES.md', label: 'ARES Architecture' },
  { name: 'SOUL.md',      label: 'Identity & Preferences' },
]

function readSoulFiles() {
  const sections = []
  for (const { name, label } of SOUL_FILES) {
    const filePath = path.join(RHM_ROOT, name)
    if (!fs.existsSync(filePath)) {
      sections.push(`## [${label}]\n_File not found: ${name}_\n`)
      continue
    }
    const content = fs.readFileSync(filePath, 'utf8').trim()
    sections.push(`## [${label}] — ${name}\n${content}\n`)
  }
  return sections.join('\n---\n\n')
}

function readWorkingFiles() {
  const inboxDir  = path.join(ARES_ROOT, 'agent_inbox')
  const outboxDir = path.join(ARES_ROOT, 'agent_outbox')

  const inboxFiles  = fs.existsSync(inboxDir)
    ? fs.readdirSync(inboxDir).filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    : []
  const outboxFiles = fs.existsSync(outboxDir)
    ? fs.readdirSync(outboxDir).filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    : []

  return [
    `## Working Files`,
    `**agent_inbox** (${inboxFiles.length} tasks):`,
    inboxFiles.length ? inboxFiles.map((f) => `  - ${f}`).join('\n') : '  (empty)',
    `\n**agent_outbox** (${outboxFiles.length} results):`,
    outboxFiles.length ? outboxFiles.map((f) => `  - ${f}`).join('\n') : '  (empty)',
  ].join('\n')
}

function formatMemoryRecord(record) {
  const ts = record.timestamp?.toDate?.()?.toISOString?.() || 'unknown time'
  if (record.type === 'learned_rule') {
    return `  - [RULE] ${record.rule || record.content || record.id} (saved ${ts})`
  }
  if (record.type === 'session_summary') {
    return `  - [SESSION SUMMARY] ${ts}: ${record.summary || record.content || '(no summary text)'}`
  }
  return `  - [${record.type || 'memory'}] ${record.content || record.id} (${ts})`
}

async function buildContextPacket(taskId = null) {
  const lines = []

  lines.push('# ARES AGENT CONTEXT PACKET')
  lines.push(`Generated: ${new Date().toISOString()}`)
  if (taskId) lines.push(`Current Task: ${taskId}`)
  lines.push('\n---\n')

  // 1. Soul files
  lines.push('# SOUL FILES (Identity + Rules)')
  lines.push(readSoulFiles())
  lines.push('\n---\n')

  // 2. Memory from Firestore
  lines.push('# MEMORY (Recent Firestore Records)')
  try {
    const records = await getRecentMemory(30)
    if (records.length === 0) {
      lines.push('_No memory records found. Firestore may not be connected._')
    } else {
      const rules    = records.filter((r) => r.type === 'learned_rule' && !r.archivedAt)
      const summaries = records.filter((r) => r.type === 'session_summary').slice(0, 3)

      lines.push(`\n### Active Learned Rules (${rules.length})`)
      if (rules.length) {
        lines.push(rules.map(formatMemoryRecord).join('\n'))
      } else {
        lines.push('  (none)')
      }

      lines.push(`\n### Recent Session Summaries (last 3)`)
      if (summaries.length) {
        lines.push(summaries.map(formatMemoryRecord).join('\n'))
      } else {
        lines.push('  (none — no Drive saves on record)')
      }
    }
  } catch (err) {
    lines.push(`_Memory load failed: ${err.message}_`)
  }
  lines.push('\n---\n')

  // 3. Backup status
  lines.push('# BACKUP STATUS')
  try {
    const { hoursSinceLastSave, taskCountSinceLastSave } = await getBackupStatus()
    const saveLabel = hoursSinceLastSave === null
      ? 'Never saved to Drive'
      : `Last save: ${hoursSinceLastSave}h ago`
    lines.push(`${saveLabel} | Tasks since last save: ${taskCountSinceLastSave}`)
    const needsBackup = hoursSinceLastSave === null || hoursSinceLastSave > 24 || taskCountSinceLastSave >= 10
    lines.push(needsBackup ? '⚠️  BACKUP RECOMMENDED after this task.' : '✅ Backup not needed yet.')
  } catch (err) {
    lines.push(`_Backup status unavailable: ${err.message}_`)
  }
  lines.push('\n---\n')

  // 4. Working files
  lines.push(readWorkingFiles())
  lines.push('\n---\n')

  lines.push('# END OF CONTEXT PACKET')
  lines.push('Proceed with your assigned task. Rules above are always in effect.\n')

  return lines.join('\n')
}

module.exports = { buildContextPacket }

// Run standalone: node load_context.js [taskId]
if (require.main === module) {
  const taskId = process.argv[2] || null
  buildContextPacket(taskId).then((packet) => {
    console.log(packet)
    process.exit(0)
  }).catch((err) => {
    console.error('[load_context] Error:', err)
    process.exit(1)
  })
}
