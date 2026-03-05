/**
 * ARES Firestore Schema Reference
 * Write access rules per SOUL_ARES.md:
 *   tasks        → Manager + Director
 *   agent_state  → Each agent (own doc only)
 *   memory       → Director only (archive, never delete)
 *   clients      → Director only
 *   token_usage  → All agents (append-only, never modify past records)
 *
 * Collections:
 *
 * 1. tasks
 * - id: string
 * - title: string
 * - description: string
 * - type: 'research' | 'content' | 'strategy' | 'data' | 'review' | 'code'  ← used for LLM routing
 * - status: 'pending' | 'in-progress' | 'complete' | 'escalated'
 * - priority: 'high' | 'medium' | 'low'
 * - assignedTo: string (agentId)
 * - createdAt: timestamp
 * - updatedAt: timestamp
 *
 * 2. agent_state
 * - id: string
 * - name: string
 * - tier: 'Director' | 'Manager' | 'Worker'
 * - model: string  (e.g. 'claude-sonnet-4-6', 'gemma3:8b')
 * - status: 'idle' | 'active' | 'error'
 * - activeTaskId: string | null
 * - currentLoopCount: number  ← warn UI at 2, halt at 3 (Loop Guard Protocol)
 * - lastActive: timestamp
 *
 * 3. token_usage  (append-only — never modify past records)
 * - id: string
 * - agentId: string
 * - taskId: string
 * - model: string  (e.g. 'claude-sonnet-4-6', 'gemma3:8b')
 * - promptTokens: number
 * - completionTokens: number
 * - totalTokens: number
 * - timestamp: timestamp
 *
 * 4. memory  (archive only — never delete)
 * - id: string
 * - type: 'session_summary' | 'learned_rule'
 * - content: string
 * - archivedAt: timestamp | null  (null = active, timestamp = archived)
 * - timestamp: timestamp
 *
 * 5. clients  (mirrors permanent.json — Director write only)
 * - id: string
 * - name: string
 * - agency: string  (e.g. 'Imajery')
 * - channels: string[]  (e.g. ['Google Ads', 'SEO'])
 * - compliance_flags: string[]
 * - tone: string | null
 * - primaryContact: string
 * - reportingCadence: string
 * - notes: string
 */
