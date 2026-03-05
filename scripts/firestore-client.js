#!/usr/bin/env node
/**
 * ARES Firestore Client (Node.js)
 * Uses Firebase Web SDK (already installed in ares/node_modules)
 * Reads credentials from ares/.env.local — no dotenv dependency needed
 */

const fs = require('fs')
const path = require('path')

// --- Env loader -----------------------------------------------------------

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) {
    console.warn('[firestore-client] .env.local not found')
    return {}
  }
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = value
  }
  return env
}

const env = loadEnv()

const firebaseConfig = {
  apiKey:            env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const hasConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)

// --- DB singleton ---------------------------------------------------------

let _db = null

async function getDb() {
  if (_db) return _db
  if (!hasConfig) {
    console.warn('[firestore-client] Firebase config incomplete — Firestore unavailable')
    return null
  }
  const { initializeApp, getApps } = await import('firebase/app')
  const { getFirestore } = await import('firebase/firestore')
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  _db = getFirestore(app)
  return _db
}

// --- Tasks ----------------------------------------------------------------

async function createTask(taskId, data) {
  const db = await getDb()
  if (!db) return null
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
  return setDoc(doc(db, 'tasks', taskId), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function updateTask(taskId, fields) {
  const db = await getDb()
  if (!db) return null
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
  return updateDoc(doc(db, 'tasks', taskId), {
    ...fields,
    updatedAt: serverTimestamp(),
  })
}

// --- Agent State ----------------------------------------------------------

async function updateAgentState(agentId, fields) {
  const db = await getDb()
  if (!db) return null
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
  return setDoc(doc(db, 'agent_state', agentId), {
    ...fields,
    lastActive: serverTimestamp(),
  }, { merge: true })
}

// --- Memory ---------------------------------------------------------------

async function writeSessionSummary(data) {
  const db = await getDb()
  if (!db) return null
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
  return addDoc(collection(db, 'memory'), {
    type: 'session_summary',
    ...data,
    timestamp: serverTimestamp(),
  })
}

async function getRecentMemory(limitCount = 20) {
  const db = await getDb()
  if (!db) return []
  const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore')
  const q = query(collection(db, 'memory'), orderBy('timestamp', 'desc'), limit(limitCount))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// --- Backup check ---------------------------------------------------------

/**
 * Returns { hoursSinceLastSave, taskCountSinceLastSave }
 * Used by agent_connector to decide whether to trigger save_to_drive
 */
async function getBackupStatus() {
  const db = await getDb()
  if (!db) return { hoursSinceLastSave: null, taskCountSinceLastSave: 0 }

  const { collection, query, orderBy, getDocs } = await import('firebase/firestore')
  const now = Date.now()

  // Find most recent session_summary
  const memSnap = await getDocs(
    query(collection(db, 'memory'), orderBy('timestamp', 'desc'))
  )
  const lastSave = memSnap.docs.map((d) => d.data()).find((d) => d.type === 'session_summary')
  const lastSaveMs = lastSave?.timestamp?.toMillis?.() || null
  const hoursSinceLastSave = lastSaveMs
    ? Math.floor((now - lastSaveMs) / 1000 / 60 / 60)
    : null // null = never saved

  // Count tasks completed since last save
  const taskSnap = await getDocs(
    query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'))
  )
  const taskCountSinceLastSave = taskSnap.docs.filter((d) => {
    const data = d.data()
    const updatedMs = data.updatedAt?.toMillis?.()
    const isComplete = data.status === 'complete'
    if (!isComplete || !updatedMs) return false
    if (!lastSaveMs) return true // never saved = count everything
    return updatedMs > lastSaveMs
  }).length

  return { hoursSinceLastSave, taskCountSinceLastSave }
}

module.exports = {
  getDb,
  createTask,
  updateTask,
  updateAgentState,
  writeSessionSummary,
  getRecentMemory,
  getBackupStatus,
}
