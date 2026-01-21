# Skills Reference Index

**Purpose**: Navigation hub for all skill-based reference files.

---

## How to Use

Skills are organized by category. Each skill file focuses on a single topic and links back to this index.

---

## Skill Categories

### Coding Standards

**Path**: `coding-standards/`

- [`typescript.md`](./coding-standards/typescript.md) - TypeScript strict mode coding standards
- [`sql.md`](./coding-standards/sql.md) - SQL migrations and naming conventions
- [`testing.md`](./coding-standards/testing.md) - Mock-based unit testing with Jest
- `error-handling.md` - Error handling patterns (TODO)

### Workflows

**Path**: `workflows/`

- [`changeset.md`](./workflows/changeset.md) - ChangeSet draft/publish workflow
- `versioning.md` - Version history and rollback (TODO)
- `publishing.md` - Publish/rollback operations (TODO)

### Architecture

**Path**: `architecture/`

- [`rbac.md`](./architecture/rbac.md) - Two-level RBAC with domain roles and customer scopes
- `module-structure.md` - Module boundaries and patterns (TODO)
- `database-design.md` - Schema design patterns (TODO)

### Development

**Path**: `development/`

- [`commands.md`](./development/commands.md) - All npm scripts and development commands
- `environment.md` - Environment variables and configuration (TODO)
- `debugging.md` - Debugging patterns and tools (TODO)

### Repository Rules

**Path**: `repository-rules/`

- [`documentation.md`](./repository-rules/documentation.md) - Documentation creation rules (CRITICAL)
- [`memory-usage.md`](./repository-rules/memory-usage.md) - MCP Memory usage guide
- `change-tracking.md` - Change history tracking (TODO)

---

## Navigation

- **Back to workspace**: `../../AGENTS.md`
- **Module designs**: `../../docs/design/`
- **Enforcement rules**: `../../.cursor/rules/rules.mdc`

---

## File Size Targets

All skill files should be:

- **Target**: 100-300 lines
- **Maximum**: 400 lines (for complex topics like RBAC or Memory)
- **Minimum**: 50 lines (brief reference files)

---

## Adding New Skills

When adding a new skill file:

1. Create the file in the appropriate category directory
2. Add entry to this master index
3. Add entry to category INDEX.md
4. Follow the skill file template:
   - "Back to index" link at top
   - Category metadata
   - Purpose section
   - Content sections
   - Related skills at bottom
