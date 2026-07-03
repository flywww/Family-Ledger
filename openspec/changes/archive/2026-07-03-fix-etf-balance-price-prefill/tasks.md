## 1. Reproduce And Test ETF Prefill

- [x] 1.1 Add a focused ETF price prefill regression test.
  TDD behavior: selecting an ETF-compatible listed holding resolves a numeric ETF quote instead of leaving create-balance price at `0`.
  Public interface: `fetchListedStockPriceFromAPI(symbol)` and, if extracted, a public balance price prefill helper used by `CreateBalanceForm`.
  Test command: `pnpm exec vitest run tests/pricing.test.ts` or the narrower focused test file created for the helper.
  Mocking: mock only the FMP network `fetch` boundary; do not mock internal pricing or form helper collaborators.
  Module depth: keep quote provider parsing inside `lib/pricing.ts` or a narrow form-facing helper; avoid exposing private call order.
  Manual-only: no DB behavior implemented in this task; authenticated create-balance browser proof is manual unless deterministic auth/test portfolio setup is available.
  RED: Prove an ETF symbol such as `VOO`, `VT`, or `QQQ` currently does not prefill a non-zero price through the selected public interface.
  GREEN: Implement the smallest change that makes the ETF prefill test pass.
  REFACTOR: Remove duplication only while GREEN and rerun the focused test.
  VALIDATE: Record focused test output in the implementation notes.

- [x] 1.2 Add provider failure coverage for ETF quote prefill.
  TDD behavior: a failed ETF quote request does not write a provider-derived `0` price.
  Public interface: same as task 1.1.
  Test command: `pnpm exec vitest run tests/pricing.test.ts` or the narrower focused test file created for the helper.
  Mocking: mock provider failure at the FMP network boundary.
  Module depth: keep error handling behind the public quote/prefill interface.
  Manual-only: no DB behavior implemented in this task; user-facing error messaging is manual review unless an existing testable status surface is present.
  RED: Prove provider failure behavior would otherwise leave a misleading zero price.
  GREEN: Preserve manual price entry and avoid treating failures as valid zero quotes.
  REFACTOR: Keep failure handling shared with existing listed-stock behavior if practical.
  VALIDATE: Record focused test output in the implementation notes.

## 2. Implement Create-Balance Prefill

- [x] 2.1 Fix ETF holding selection in the new balance form.
  TDD behavior: selecting an existing US-listed ETF holding in `/balance/create` fetches the listed-security price and writes it into the price field.
  Public interface: `CreateBalanceForm` holding selection behavior and the server action it calls for listed-security quotes.
  Test command: `npm run typecheck` plus the focused test from task 1.1.
  Mocking: no UI-internal mocks; keep provider mocks only in focused tests.
  Module depth: prefer a small form-facing helper only if it improves testability or removes create/edit duplication.
  Manual-only: no DB behavior implemented in this task; visual review and create-and-visible proof for `/balance/create`.
  RED: Use the regression test or manual reproduction to show ETF selection leaves price at `0`.
  GREEN: Update selection/classification/metadata handling so ETF holdings use the same quote path as US stocks.
  REFACTOR: Keep the existing form UI and shadcn/Radix components unchanged unless needed for correctness.
  VALIDATE: Confirm ETF selection updates `price`, `currency`, and derived `value`.

- [x] 2.2 Preserve existing listed asset behavior.
  TDD behavior: US stock, Taiwan listed-stock, and cryptocurrency prefill paths continue to use their existing providers.
  Public interface: `fetchListedStockPriceFromAPI(symbol)`, `fetchCryptoPriceFromAPI(id)`, and create-balance holding selection.
  Test command: `pnpm exec vitest run tests/pricing.test.ts`.
  Mocking: provider/network responses only.
  Module depth: no new provider abstraction unless existing duplication requires it.
  Manual-only: no DB behavior implemented in this task; monthly refresh behavior is not changed in this task.
  RED: Existing focused tests stay in place for TSLA and Taiwan source IDs.
  GREEN: Keep those tests passing while adding ETF coverage.
  REFACTOR: Avoid broad `lib/actions.ts` restructuring.
  VALIDATE: Record focused pricing test results.

## 3. Review And Validation

- [x] 3.1 Run local validation for the scoped behavior change.
  TDD behavior: ETF price prefill works without regressing existing listed-security pricing.
  Public interface: pricing/prefill helper and create-balance form workflow.
  Test command: `npm run typecheck`, `npm run lint`, focused Vitest command, and `npm run docs:check`.
  Mocking: no additional mocks beyond provider/network boundaries.
  Module depth: final diff remains scoped to pricing/prefill/form code and tests.
  Manual-only: no DB behavior implemented in this task; `npm run build` can be run if implementation touches route or server-action behavior broadly; record if skipped.
  RED: Confirm the failing behavior was captured before implementation.
  GREEN: Confirm focused tests pass after implementation.
  REFACTOR: Confirm focused tests rerun after any cleanup.
  VALIDATE: Record all run, skipped, or failing checks.
  Evidence: `npm run typecheck`, `npm run lint`, `npm run docs:check`, `pnpm exec vitest run tests/balance-price-prefill.test.ts`, and `pnpm exec vitest run tests/pricing.test.ts` passed. Focused pricing coverage includes FMP 402 from stable quote, FMP 402 from quote-short, Yahoo chart fallback for ETF symbol `XLK`, FMP quote-short success for ETF symbol `VT`, and invalid zero-price rejection. Live Yahoo chart probe returned USD prices for `VT` and `XLK`. `npm run build` was skipped because the implementation did not broaden route/server-action behavior.

- [x] 3.2 Complete visual review and create-and-visible workflow proof.
  TDD behavior: the existing create-balance workflow visibly uses the fetched ETF price.
  Public interface: `/balance/create`.
  Test command: manual authenticated browser review, or Playwright/browser proof if deterministic auth is available.
  Mocking: none.
  Module depth: existing UI workflow only.
  Manual-only: no DB behavior implemented in this task; authenticated portfolio data and deployment smoke checks.
  RED: Record the observed pre-fix ETF price `0` behavior.
  GREEN: Select an ETF holding and verify price and value fields update.
  REFACTOR: Confirm no layout overflow or unrelated stacked content appears in the form.
  VALIDATE: If safe test data is available, save the balance and verify it is visible in the selected month; otherwise record why create-and-visible proof was skipped.
  Evidence: Browser proof was attempted against local dev server with demo login and existing ETF holdings `VT` / `XLK`. System Chrome aborted in headless mode, and Playwright bundled Chromium was not installed. No browser install or database write was performed. Static review confirms the changed form path reuses the existing combobox/input layout and only changes quote-prefill classification.

- [x] 3.3 Use the deployment-aware OpenSpec gate before archive.
  TDD behavior: the change is not archived until required local and deployment evidence is recorded or explicitly skipped.
  Public interface: OpenSpec archive readiness notes.
  Test command: `npm run docs:check` and the final scoped validation commands.
  Mocking: none.
  Module depth: process task only.
  Manual-only: commit/push, Vercel deployment, deployed smoke check, and archive confirmation.
  RED: Do not archive before implementation evidence exists.
  GREEN: After local validation, ask before commit/push if the maintainer wants to ship.
  REFACTOR: Keep archive notes concise and evidence-based.
  VALIDATE: Record branch/worktree path, local checks, deployment result, smoke-check URL, and skipped checks before archive.
  Evidence: Worktree path `/Users/stanley/Library/Mobile Documents/iCloud~md~obsidian/Documents/LifeOSVault/01 Inbox/20240912 FamilyLedger project/family-ledger`. Local checks passed: `pnpm exec vitest run tests/pricing.test.ts`, `pnpm exec vitest run tests/balance-price-prefill.test.ts`, `npm run typecheck`, `npm run lint`, and `npm run docs:check`. Maintainer reported the local `/balance/create` ETF selection works. User explicitly requested completing and pushing the code. Vercel deployment verification and deployed smoke check are skipped until after push/deployment is available.
