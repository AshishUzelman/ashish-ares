import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

// Agent State — real-time listener, all agents
export function subscribeToAgentState(callback) {
  const q = query(collection(db, 'agent_state'), orderBy('lastActive', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const agents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(agents)
  })
}

// Task Queue — real-time listener, most recent 50 tasks
export function subscribeToTasks(callback) {
  const q = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'), limit(50))
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(tasks)
  })
}

// Token Usage — real-time listener, most recent 100 records
export function subscribeToTokenUsage(callback) {
  const q = query(collection(db, 'token_usage'), orderBy('timestamp', 'desc'), limit(100))
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(records)
  })
}

// Memory — real-time listener, active records only (archivedAt == null)
export function subscribeToMemory(callback) {
  const q = query(collection(db, 'memory'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(records)
  })
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
