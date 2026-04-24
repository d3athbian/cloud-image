---

description: "Task list for Zod migration in Global Configuration Management"

---

# Tasks: Zod Migration - Global Configuration Management

**Input**: Design documents from `/specs/025-global-config-management/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup - Install Zod

**Purpose**: Add Zod as project dependency

- [x] T001 Install zod package: `npm install zod` in packages/cloud
- [x] T002 Verify zod is added to package.json dependencies

---

## Phase 2: Migrate CoreServiceOptions to Zod Schema

**Purpose**: Replace manual validation dictionary with Zod schema

### Implementation

- [x] T003 [P] Rewrite `packages/cloud/src/types/core-options.ts` using Zod schema
- [x] T004 [P] Export type inferred from Zod schema: `type CoreServiceOptions = z.infer<typeof CoreServiceOptionsSchema>`
- [x] T005 Update `packages/cloud/src/config/defaults.ts` to use Zod's `.parse()` for validation
- [x] T006 Remove manual validation dictionary from defaults.ts

**Checkpoint**: Configuration uses Zod for validation

---

## Phase 3: Validate Schema Works Correctly

**Purpose**: Ensure Zod migration doesn't break existing functionality

### Implementation

- [x] T007 Run `npm run typecheck` to verify types are correct
- [x] T008 Run `npm run lint` to verify no lint errors in new code
- [x] T009 Test that getSystemSettings() returns valid configuration

**Checkpoint**: Zod migration complete, all checks pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - installs Zod
- **Migration (Phase 2)**: Depends on Phase 1 - migrates schema
- **Validation (Phase 3)**: Depends on Phase 2 - verifies migration

### Within Each Phase

- Phase 2 tasks can run in parallel (different files, no dependencies)
- Phase 3 tasks should run sequentially

---

## Notes

- Using Zod provides: runtime validation + type inference from single schema source
- Bundle size impact: ~2KB (zod/mini) or ~5KB (regular zod)
- This is an enhancement to existing feature, no new user stories