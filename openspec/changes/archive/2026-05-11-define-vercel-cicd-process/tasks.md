## 1. Source Document Updates

- [x] 1.1 Read `AGENTS.md`, `docs/testing-strategy.md`, `docs/validation-harness.md`, and `openspec/config.yaml` for the current process and validation rules.
- [x] 1.2 Update `AGENTS.md` so the repository guide describes the deployment-aware OpenSpec lifecycle and the archive-after-deployment rule.
- [x] 1.3 Update `docs/testing-strategy.md` with the CI/CD validation sequence: local checks, GitHub push, Vercel deployment, deployed smoke check, and archive.
- [x] 1.4 Update `docs/validation-harness.md` to map the CI/CD deployment gate to its automated and manual validation paths.

## 2. OpenSpec Process Routing

- [x] 2.1 Inspect `openspec/config.yaml` and keep it concise; add only a lightweight task/process reminder if the source docs alone do not enforce the deployment gate clearly.
- [x] 2.2 Ensure OpenSpec tasks for deployment-sensitive changes can identify branch/worktree, Vercel Preview, production verification, skipped checks, and manual-only rules.
- [x] 2.3 Avoid adding dependencies, GitHub Actions, Playwright, Vercel setting changes, environment variable changes, Prisma schema changes, or database changes in this process-only change.

Visual review: not applicable; this process-only change does not alter UI, layout, reusable components, or visual tokens.

## 3. Validation

- [x] 3.1 Run `npm run docs:check`.
- [x] 3.2 Run `npm run harness:check`.
- [x] 3.3 Record any skipped checks, failing checks, or manual-only rules in the change notes.

## 4. Deployment And Archive Readiness

- [x] 4.1 If this process-only change is committed and pushed, verify the resulting Vercel deployment succeeds before archiving.
- [x] 4.2 Smoke-check the deployed app URL after Vercel completes, or record why deployment verification was not applicable before archive.
- [x] 4.3 Confirm `openspec status --change define-vercel-cicd-process` reports the change ready for implementation/archive workflow handoff.

## Change Notes

- `npm run docs:check`: passed.
- `npm run harness:check`: passed.
- Skipped checks: Vercel deployment verification was not run because this session did not commit or push the process-only documentation change.
- Manual-only rules: deployment success, deployed URL load, touched-route smoke check, skipped-check recording, and archive readiness remain manual until automated browser or CI deployment checks are introduced.
- Archive note: after these docs are committed and pushed, verify the relevant Vercel deployment and deployed smoke check before running `/opsx:archive`.
