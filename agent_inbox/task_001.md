# TASK 001 - ARES Dashboard Architecture Review & Fixes
**Priority**: High
**Assignee**: Claude (Terminal Agent)
**Initiator**: Gemini (IDE Agent)

## Context
I (Gemini) have begun scaffolding the Phase 1 UI for the ARES platform. The user wants to ensure our agent orchestration platform is built correctly, follows the established memory architecture, and does not have Next.js linting errors. 

**I need you to review what I built, correct any architectural mistakes I made regarding file placement, and fix my React code.**

## Part 1: Memory Alignment & Structure Review
Before fixing code, please load and read the user's core memory files to understand the project architecture:
1. Load `~/.claude/worktrees/intelligent-torvalds/SOUL.md` (Base Rules)
2. Load `~/.claude/worktrees/intelligent-torvalds/SOUL_ARES.md` (ARES Platform Architecture)
3. Load `~/.claude/worktrees/intelligent-torvalds/CLAUDE.md` (Project Registry)

*My potential mistake:* I scaffolded the Next.js `ares` project inside `~/rank-higher-media/ares/` because I am sandboxed to the current IDE workspace. Please review the `CLAUDE.md` rules about whether `ares` belongs inside the `rank-higher-media` repo or if it needs to be moved to its own `~/projects/ares` structure as per the Firebase Naming Convention rules. **If it needs to move, please move it.**

## Part 2: Code Review & Linting Fixes
I built out the `ares/src/app/` layout and components, but introduced strict React Hook rules violations regarding `Date.now()` and internal rendering purity.

1. Review `ares/src/hooks/useMemoryState.js` and `ares/src/components/SystemHeader.js`.
2. I attempted to fix the `react-hooks/set-state-in-effect` and `react-hooks/purity` errors caused by `Date.now()`, but I failed to get `npm run lint` to pass successfully.
3. **Your Task**: Rewrite `useMemoryState.js` so that it completely satisfies the Next.js ESLint requirements regarding impure renders and hydration.
4. Run `npm run lint` inside the `ares` directory to verify your fix.

## Part 3: Firebase Integration
Currently, `AgentStatus.js` and `TaskQueue.js` are using hardcoded mock arrays.
1. Review `ares/src/lib/firebase/config.js` and `schema.js`.
2. Hook up the UI components to Firestore so they read from the `agent_state` and `tasks` collections.

## Completion Criteria
When finished:
1. Run `npm run lint` and `npm run build` to ensure the app compiles flawlessly.
2. Create a summary file named `task_001_complete.md` inside `ares/agent_outbox/` detailing:
   - Whether you moved the project directory structure to follow `CLAUDE.md` rules.
   - How you fixed the React Hook purity errors.
   - Confirmation that the Firebase connection is wired up.
