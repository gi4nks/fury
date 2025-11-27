<Goals>
- Reduce the likelihood of a coding agent pull request getting rejected by the user due to
generating code that fails the continuous integration build, fails a validation pipeline, or
having misbehavior.
- Minimize bash command and build failures.
- Allow the agent to complete its task more quickly by minimizing the need for exploration using grep, find, str_replace_editor, and code search tools.
</Goals>

<HighLevelDetails>
- A summary of what the repository does: Fury is a Next.js web application that imports Chrome bookmark HTML exports, automatically categorizes bookmarks using AI, and provides a modern web interface for browsing and searching bookmarks. It emphasizes privacy by storing all data locally in SQLite.
- High level repository information, such as the size of the repo, the type of the project, the languages, frameworks, or target runtimes in use: Full-stack web application, TypeScript, Next.js 16 (App Router), React 19, Tailwind CSS 4, DaisyUI, SQLite with Prisma ORM, OpenAI API, Node.js 20+.
</HighLevelDetails>

<BuildInstructions>
- For each of bootstrap, build, test, run, lint, and any other scripted step, document the sequence of steps to take to run it successfully as well as the versions of any runtime or build tools used.
- Each command should be validated by running it to ensure that it works correctly as well as any preconditions and postconditions.
- Try cleaning the repo and environment and running commands in different orders and document errors and and misbehavior observed as well as any steps used to mitigate the problem.
- Run the tests and document the order of steps required to run the tests.
- Make a change to the codebase. Document any unexpected build issues as well as the workarounds.
- Document environment setup steps that seem optional but that you have validated are actually required.
- Document the time required for commands that failed due to timing out.
- When you find a sequence of commands that work for a particular purpose, document them in detail.
- Use language to indicate when something should always be done. For example: "always run npm install before building".
- Record any validation steps from documentation.

Bootstrap (One-time Setup):
Always run these commands in order when setting up the project for the first time:
1. `npm install` - Install all dependencies (Node.js 20+ required)
2. `npm run prisma:generate` - Generate Prisma client
3. `npm run prisma:migrate` - Run database migrations
Validated sequence: `npm install && npm run prisma:generate && npm run prisma:migrate`
Time: ~2-3 seconds for install, ~1 second for Prisma commands
Preconditions: Node.js 20+, npm installed
Postconditions: All dependencies installed, database schema created, Prisma client generated

Build:
`npm run build` - Create production build
Time: ~2-3 seconds
Preconditions: Dependencies installed, database schema exists
Postconditions: Optimized production build in `.next/` directory
Expected warnings: CSS optimization warnings for DaisyUI (safe to ignore)

Test:
No automated tests implemented yet. Manual testing required.

Run (Development):
`npm run dev` - Start development server
Time: ~0.5 seconds to start
Preconditions: Dependencies installed
Postconditions: Server running on http://localhost:3000
Environment variables: Optional `.env` file with `OPENAI_API_KEY`

Run (Production):
`npm run start` - Start production server
Time: ~1-2 seconds to start
Preconditions: `npm run build` completed successfully
Postconditions: Server running on http://localhost:3000

Lint:
`npm run lint` - Run ESLint
Time: <1 second
Preconditions: Dependencies installed
Configuration: `eslint.config.mjs` (Next.js + TypeScript rules)
Expected output: Clean output if no issues

Type Check:
`npx tsc --noEmit` - Run TypeScript compiler check
Time: ~1-2 seconds
Preconditions: Dependencies installed
Configuration: `tsconfig.json` (strict mode enabled)
Expected output: Clean output if no type errors

Database Operations:
`npm run prisma:migrate` - Apply pending migrations
`npm run prisma:generate` - Regenerate Prisma client after schema changes
`npx prisma studio` - Open database GUI (requires database to exist)

Validation Steps:
1. Pre-commit checks: Always run `npm run lint && npx tsc --noEmit` before committing
2. Build validation: Run `npm run build` to ensure production readiness
3. Environment check: Verify `.env` file exists with required variables if using AI features

Common Issues and Workarounds:
- Database connection: Ensure `prisma/dev.db` exists; run `npm run prisma:migrate` if missing
- Type errors: Check `tsconfig.json` paths; ensure `@/*` aliases resolve correctly
- Build failures: Clear `.next/` cache with `rm -rf .next` and rebuild
- Prisma issues: Run `npm run prisma:generate` after schema changes

Environment Setup:
Required: Node.js 20+, npm
Optional but recommended: `.env` file with `OPENAI_API_KEY` for AI features
Database: SQLite (file-based, no additional setup required)
Ports: Development server uses 3000 (configurable via Next.js)
</BuildInstructions>

<ProjectLayout>
- A description of the major architectural elements of the project, including the relative paths to the main project files, the location of configuration files for linting, compilation, testing, and preferences: Frontend (src/app/), Components (src/components/), Business logic (src/lib/), Database (prisma/), Configuration (tsconfig.json, eslint.config.mjs, next.config.ts)
- A description of the checks run prior to check in, including any GitHub workflows, continuous integration builds, or other validation pipelines: GitHub Actions CI runs ESLint, TypeScript checking, and production build on push/PR to main/develop branches
- Document the steps so that the agent can replicate these itself: Run `make check` locally or push to trigger CI
- Any explicit validation steps that the agent can consider to have further confidence in its changes: Always run `npm run build` after changes to ensure production readiness
- Dependencies that aren't obvious from the layout or file structure: OpenAI API for AI features, Prisma for database ORM
- Finally, fill in any remaining space with detailed lists of the following, in order of priority: the list of files in the repo root, the contents of the README, the contents of any key source files, the list of files in the next level down of directories, giving priority to the more structurally important and snippets of code from key source files, such as the one containing the main method.

Repository Root Files:
- .github/workflows/ci.yml - GitHub Actions CI configuration
- .github/copilot-instructions.md - This instructions file
- .env.example - Environment variables template
- Makefile - Build automation
- README.md - Project documentation
- LICENSE - MIT license
- eslint.config.mjs - ESLint configuration
- next-env.d.ts - Next.js TypeScript types
- next.config.ts - Next.js configuration
- package.json - Dependencies and scripts
- postcss.config.mjs - PostCSS configuration
- prisma.config.ts - Prisma configuration
- tailwind.config.ts - Tailwind configuration
- tsconfig.json - TypeScript configuration
- tsconfig.tsbuildinfo - TypeScript build cache

README.md Contents:
Fury is a lightweight bookmark organizer that imports Chrome-exported HTML bookmarks, auto-categorizes them locally, and lets you search or browse by category without leaving the browser. Features include AI-powered categorization, smart search, analytics dashboard, metadata enrichment, and export functionality.

Key Source Files:
- src/app/page.tsx - Home dashboard with statistics
- src/lib/db.ts - Prisma client instance
- prisma/schema.prisma - Database schema with Bookmark and Category models

Major Directories:
- src/app/ - Next.js App Router pages and API routes
- src/components/ - Reusable React components
- src/lib/ - Core business logic and utilities
- prisma/ - Database schema and migrations
- .github/ - GitHub configuration and workflows
</ProjectLayout>