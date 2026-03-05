#!/usr/bin/env node
/**
 * ARES Agent Connector — Enhanced
 *
 * Watches agent_inbox/ for task files and orchestrates Claude execution.
 *
 * Per-task flow:
 *  1. Detect task file → parse task ID and metadata
 *  2. Write task to Firestore (status: pending)
 *  3. Update agent_state: claude-terminal → working
 *  4. Load Agent Context Packet (soul files + Firestore memory)
 *  5. Write context to temp file
 *  6. Update Firestore: status → in_progress
 *  7. Invoke Claude Code with context + task
 *  8. Read outbox result
 *  9. Update Firestore: status → complete, save result excerpt
 * 10. Update agent_state: claude-terminal → idle
 * 11. Check backup triggers (>24h since last save OR ≥10 tasks since last save)
 * 12. Run save_to_drive.js if backup is needed
 * 13. Archive task file
 */

const fs   = require('fs')
const path = require('path')
const { execSync, spawnSync } = require('child_process')
const { buildContextPacket } = require('./load_context')
const {
  createTask,
  updateTask,
  updateAgentState,
  getBackupStatus,
} = require('./firestore-client')

const INBOX_DIR  = path.join(__dirname, '../agent_inbox')
const OUTBOX_DIR = path.join(__dirname, '../agent_outbox')
const TMP_DIR    = '/tmp'

// --- Ensure directories exist ---------------------------------------------

if (!fs.existsSync(INBOX_DIR))  fs.mkdirSync(INBOX_DIR,  { recursive: true })
if (!fs.existsSync(OUTBOX_DIR)) fs.mkdirSync(OUTBOX_DIR, { recursive: true })

// --- Task metadata parsing ------------------------------------------------

function parseTaskMetadata(content) {
  const title    = (content.match(/^#\s+(.+)/m)        || [])[1]?.trim() || 'Unknown Task'
  const priority = (content.match(/^\*\*Priority\*\*:\s*(.+)/im) || [])[1]?.trim() || 'normal'
  const assignee = (content.match(/^\*\*Assignee\*\*:\s*(.+)/im) || [])[1]?.trim() || 'claude-terminal'
  const initiator = (content.match(/^\*\*Initiator\*\*:\s*(.+)/im) || [])[1]?.trim() || 'unknown'
  return { title, priority, assignee, initiator }
}

// --- Backup trigger check -------------------------------------------------

async function runBackupIfNeeded() {
  try {
    const { hoursSinceLastSave, taskCountSinceLastSave } = await getBackupStatus()
    const neverSaved = hoursSinceLastSave === null
    const stale      = hoursSinceLastSave !== null && hoursSinceLastSave > 24
    const manyTasks  = taskCountSinceLastSave >= 10

    if (neverSaved || stale || manyTasks) {
      const reason = neverSaved  ? 'never saved to Drive'
                   : stale       ? `${hoursSinceLastSave}h since last save`
                   : `${taskCountSinceLastSave} tasks since last save`
      console.log(`\n📦 Backup triggered (${reason})`)
      spawnSync('node', [path.join(__dirname, 'save_to_drive.js')], { stdio: 'inherit' })
    } else {
      console.log(`✅ Backup not needed (${hoursSinceLastSave}h ago, ${taskCountSinceLastSave} tasks since save)`)
    }
  } catch (err) {
    console.warn('[connector] Backup check failed:', err.message)
  }
}

// --- Core task processor --------------------------------------------------

async function processTask(filename) {
  const filePath = path.join(INBOX_DIR, filename)
  if (!fs.existsSync(filePath)) return

  // Extract task ID from filename: task_001.md → task_001
  const taskId = filename.replace(/\.md$/, '')
  const outboxFile = path.join(OUTBOX_DIR, `${taskId}_complete.md`)
  const contextFile = path.join(TMP_DIR, `ares_context_${taskId}.md`)

  console.log(`\n🔔 Task received: ${filename}`)

  const taskContent = fs.readFileSync(filePath, 'utf8')
  const { title, priority, assignee, initiator } = parseTaskMetadata(taskContent)
  console.log(`   Title:    ${title}`)
  console.log(`   Priority: ${priority} | Assignee: ${assignee} | From: ${initiator}`)

  // 1. Write to Firestore (pending)
  try {
    await createTask(taskId, { title, priority, assignee, initiator, source: 'agent_inbox' })
    console.log(`   📝 Firestore: task created (pending)`)
  } catch (err) {
    console.warn(`   [Firestore] createTask failed: ${err.message}`)
  }

  // 2. Set agent state → working
  try {
    await updateAgentState('claude-terminal', {
      agentId: 'claude-terminal',
      model: 'claude-sonnet-4-6',
      status: 'working',
      currentTask: taskId,
      tier: 'worker',
    })
    console.log(`   📝 Firestore: agent_state updated (working)`)
  } catch (err) {
    console.warn(`   [Firestore] updateAgentState failed: ${err.message}`)
  }

  // 3. Build context packet
  console.log('   🧠 Loading context packet...')
  let contextPacket = ''
  try {
    contextPacket = await buildContextPacket(taskId)
    fs.writeFileSync(contextFile, contextPacket, 'utf8')
    console.log(`   ✅ Context written to ${contextFile}`)
  } catch (err) {
    console.warn(`   [Context] Build failed: ${err.message}`)
    contextPacket = `[Context load failed: ${err.message}]`
    fs.writeFileSync(contextFile, contextPacket, 'utf8')
  }

  // 4. Update Firestore → in_progress
  try {
    await updateTask(taskId, { status: 'in_progress' })
    console.log(`   📝 Firestore: task status → in_progress`)
  } catch (err) {
    console.warn(`   [Firestore] updateTask failed: ${err.message}`)
  }

  // 5. Invoke Claude Code
  console.log('\n🤖 Handing off to Claude Code...\n')
  const prompt = [
    `First, read and internalize the Agent Context Packet at: ${contextFile}`,
    ``,
    `Then read and execute the task instructions at: ${filePath}`,
    ``,
    `When finished, create a summary file at: ${outboxFile}`,
    `detailing what you did, what decisions were made, and any follow-up recommendations.`,
    ``,
    `Rules from the context packet are always in effect. Do not skip any step.`,
  ].join('\n')

  let claudeSuccess = false
  try {
    execSync(`claude ${JSON.stringify(prompt)}`, { stdio: 'inherit' })
    claudeSuccess = true
  } catch (err) {
    console.error(`\n❌ Claude execution error: ${err.message}`)
  }

  // 6. Read outbox result
  let resultExcerpt = '(no result file found)'
  if (fs.existsSync(outboxFile)) {
    const result = fs.readFileSync(outboxFile, 'utf8')
    resultExcerpt = result.slice(0, 500) // first 500 chars for Firestore
    console.log(`\n✅ Result file found: ${outboxFile}`)
  } else {
    console.warn(`\n⚠️  No result file at ${outboxFile}`)
  }

  // 7. Update Firestore → complete (or failed)
  const finalStatus = claudeSuccess ? 'complete' : 'failed'
  try {
    await updateTask(taskId, { status: finalStatus, resultExcerpt })
    console.log(`   📝 Firestore: task status → ${finalStatus}`)
  } catch (err) {
    console.warn(`   [Firestore] final updateTask failed: ${err.message}`)
  }

  // 8. Set agent state → idle
  try {
    await updateAgentState('claude-terminal', { status: 'idle', currentTask: null })
    console.log(`   📝 Firestore: agent_state → idle`)
  } catch (err) {
    console.warn(`   [Firestore] updateAgentState idle failed: ${err.message}`)
  }

  // 9. Cleanup temp context file
  if (fs.existsSync(contextFile)) fs.unlinkSync(contextFile)

  // 10. Check backup triggers
  console.log('\n🔍 Checking backup status...')
  await runBackupIfNeeded()

  // 11. Archive task file
  const archiveDir = path.join(INBOX_DIR, 'archive')
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir)
  fs.renameSync(filePath, path.join(archiveDir, filename))
  console.log(`\n📁 Task archived: agent_inbox/archive/${filename}`)
  console.log(`── Task ${taskId} complete ──\n`)
}

// --- Startup: drain inbox then watch -------------------------------------

console.log('\n🤖 ARES Agent Connector (Enhanced)')
console.log(`Inbox:  ${INBOX_DIR}`)
console.log(`Outbox: ${OUTBOX_DIR}`)
console.log('Firestore + memory context enabled\n')

const existingTasks = fs.readdirSync(INBOX_DIR).filter((f) => f.endsWith('.md'))
if (existingTasks.length > 0) {
  console.log(`📦 ${existingTasks.length} task(s) queued on startup — processing...`)
  ;(async () => {
    for (const f of existingTasks) await processTask(f)
  })()
} else {
  console.log('⏳ Waiting for tasks...')
}

fs.watch(INBOX_DIR, (eventType, filename) => {
  if (eventType === 'rename' && filename && filename.endsWith('.md')) {
    const fullPath = path.join(INBOX_DIR, filename)
    if (fs.existsSync(fullPath)) {
      processTask(filename).catch((err) => {
        console.error(`[connector] processTask error: ${err.message}`)
      })
    }
  }
})
