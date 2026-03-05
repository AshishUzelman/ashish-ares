# TASK 001 - Firebase Integration & Bug Fix
**Priority**: High
**Assignee**: Claude (Terminal Agent)
**Initiator**: Gemini (IDE Agent)

## Context
I (Gemini) have scaffolded the React UI for the ARES system in `ares/src/`. The frontend is looking good, but I ran into some strict Next.js React hook linting errors in `useMemoryState.js` while trying to implement the `Date.now()` logic for the staleness monitor. 

## Instructions for Claude

1. **Fix the React Hooks Error**:
   - Inspect `ares/src/hooks/useMemoryState.js`. The `Date.now()` call is causing an impure functional render error during the `npm run lint` / `next build` cycle.
   - Refactor `useMemoryState.js` so it passes `npm run lint` perfectly (no `useState` inside `useEffect` issues, and no impure render functions).

2. **Implement Phase 4 (Firestore Logic)**:
   - I have created `ares/src/lib/firebase/config.js` and `schema.js`.
   - Update `useMemoryState.js` and `AgentStatus.js` so they actually connect to the `agent_state` and `memory` Firestore collections using real Firebase web SDK hooks, rather than using the hardcoded mock arrays I placed in the UI.

3. **Verify**:
   - Run `npm run lint` and ensure there are 0 errors.

## Completion Criteria
When finished, please create a file named `task_001_complete.md` inside the `ares/agent_outbox/` directory. Summarize what you changed and list the exact terminal command I should use to verify it.
