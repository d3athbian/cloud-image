# Carbon Image Constitution

<!-- Sync Impact Report (2026-04-06) -->
<!-- Version: 1.1.0 → 1.2.0 -->
<!-- Changes: Added Demo & Testing Infrastructure principle, updated Observability to include demo app testing -->

## Core Principles

### I. Library-First

Every feature MUST be implemented as a standalone, self-contained library. Libraries MUST be independently testable, documented, and have a clear, single-purpose API. No organizational-only or "shared utility" libraries without a distinct domain purpose. Libraries MUST NOT introduce unnecessary external dependencies.

**Rationale**: Modular libraries enable reuse, testing, and clear ownership. Dependencies MUST be justified per library.

### II. Observability & DevTools

Every library SHOULD provide observability through structured logging and debug tools. Library MUST expose a programmatic API for cache manipulation (get, set, clear, stats). DevTools integration MUST support cache inspection, network throttling simulation, and performance metrics viewing.

All operations MUST produce structured, machine-parseable logs. Logs MUST include context (request IDs, operation names, duration). Errors MUST be logged with full stack traces and correlation IDs.

**Rationale**: Observability enables debugging in production and performance analysis.

### III. Test-First (NON-NEGOTIABLE)

Tests MUST be written before implementation (TDD). The cycle is: write failing tests → implement minimal code to pass → refactor. All public APIs MUST have unit test coverage. Integration tests are required for library contracts and inter-component communication. Demo applications MUST be used to manually verify critical user flows.

**Rationale**: Test-first ensures correctness is verified, not assumed. Coverage is non-negotiable for reliability.

### IV. Versioning & Breaking Changes

All libraries MUST use Semantic Versioning (MAJOR.MINOR.PATCH). Breaking changes (API removals, behavioral changes) MUST increment MAJOR version and include a migration guide. Changelogs MUST be maintained per library.

**Rationale**: Predictable versioning enables dependency management and reduces integration surprises.

## Additional Constraints

### Technology Standards

- **Language**: TypeScript 5.x (strict mode)
- **Testing Framework**: Vitest (unit), Playwright (integration/e2e)
- **Build System**: Vite
- **Code Formatting**: MUST use automated formatting (ESLint + Prettier) with checked-in config

**Rationale**: Standardized tooling reduces friction and ensures consistent style across contributors.

### Code Quality Gates

All pull requests MUST pass:
1. Automated linting (no warnings)
2. All unit tests (100% pass rate)
3. All integration tests
4. Code coverage above 80% for new code
5. No new dependencies without justification in PR description

**Rationale**: Automated gates prevent regressions and enforce standards without manual overhead.

## Development Workflow

### Feature Development

1. Create feature branch from `main`
2. Write spec document in `specs/[feature-name]/spec.md`
3. Write implementation plan in `specs/[feature-name]/plan.md`
4. Implement with test-first approach
5. Ensure all quality gates pass
6. Submit pull request with documentation updates

### Demo & Testing

- Demo applications MUST exercise all library features to verify functionality
- Demo tests MUST include: cache recovery, persistence across refresh, offline behavior, network resilience
- Demo environment MUST support Chrome browser testing with DevTools integration

**Rationale**: Demos serve as integration tests and user validation.

### Code Review

- Reviews MUST include verification against constitution principles
- Complexity MUST be justified in PR description
- At least one approval required before merge
- Reviewers MUST check for test coverage adequacy

### Branch Strategy

- `main`: Production-ready, always deployable
- `feature/*`: Feature development (from `main`)
- `fix/*`: Bug fixes (from `main` or release branch)

**Rationale**: Simple branch strategy reduces merge conflicts and deployment risk.

## Governance

### Amendment Procedure

1. Proposal: Document proposed change with rationale in an issue
2. Discussion: 5-day comment period for community feedback
3. Decision: Project maintainers review and vote
4. Implementation: Approved changes merged to `main`
5. Compliance: Existing code MUST be updated within 2 weeks of amendment

**Rationale**: Transparent amendment process ensures community buy-in and avoids unilateral changes.

### Compliance Review

- All pull requests MUST verify compliance with constitution principles
- Major deviations MUST be documented and approved before implementation
- Constitution violations in merged code MUST be addressed within 30 days

### Supersession

This constitution SUPERSEDES all other development practices. In case of conflict, this document takes precedence.

**Version**: 1.2.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-04-06