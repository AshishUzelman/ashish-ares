import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

const onError = (label) => (err) => console.error(`[ARES Firestore] ${label}:`, err.message)

// Agent State — real-time listener, all agents
export function subscribeToAgentState(callback) {
  const q = query(collection(db, 'agent_state'), orderBy('lastActive', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('agent_state'))
}

// Task Queue — real-time listener, most recent 50 tasks
export function subscribeToTasks(callback) {
  const q = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'), limit(50))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('tasks'))
}

// Token Usage — real-time listener, most recent 100 records
export function subscribeToTokenUsage(callback) {
  const q = query(collection(db, 'token_usage'), orderBy('timestamp', 'desc'), limit(100))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('token_usage'))
}

// Memory — real-time listener, ordered by timestamp desc
export function subscribeToMemory(callback) {
  const q = query(collection(db, 'memory'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('memory'))
}

// Token Usage — append only. Never call update/delete on this collection.
export async function logTokenUsage({ agentId, taskId, model, promptTokens, completionTokens }) {
  return addDoc(collection(db, 'token_usage'), {
    agentId,
    taskId,
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    timestamp: serverTimestamp(),
  })
}

// Summarize token usage by model from a records array
export function aggregateTokensByModel(records) {
  return records.reduce((acc, record) => {
    const model = record.model || 'unknown'
    if (!acc[model]) acc[model] = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    acc[model].promptTokens += record.promptTokens || 0
    acc[model].completionTokens += record.completionTokens || 0
    acc[model].totalTokens += record.totalTokens || 0
    return acc
  }, {})
}
