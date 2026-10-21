# 06 — Workflows & Recipes

Step-by-step procedures for common jobs. Replace the `<placeholders>` with your project's values (see [00 §5](./00-start-here.md#5-placeholders-used-in-this-guide)). A complete example on a real project is in [Appendix A](./appendix-a-reference-implementation.md).

Each recipe states **when to use it**, **which tools** it needs, the **steps**, and **how you know you're done**.

---

## Recipe 1 — Add tests for a new feature

**When:** a feature has been built (or changed) and has no automated tests yet.
**Tools:** Planner, Generator, Healer, test runner.

1. **Create a branch** for the work: `git switch -c test/<feature>`
2. **Check the seed test passes:** `npx playwright test <tests>/seed.spec.<ext>`. If it fails, fix it first, because every agent depends on it.
3. **Ask the Planner for a plan.** Use the request template in [04 §4](./04-test-agents.md#4--planner). It saves a file such as `specs/<feature>.md`.
4. **Read the plan and correct it**, using the checklist in [04 §4](./04-test-agents.md#4--planner). Remove anything out of scope, and confirm anything marked as an assumption. Commit the plan, so the tests are generated from an agreed version.
5. **Ask the Generator for one scenario at a time** ([04 §5](./04-test-agents.md#5--generator)). Each request produces one test file.
6. **Run the new tests:** `npx playwright test <tests>/<feature>`
7. **For each failure, ask the Healer**, one test at a time ([04 §6](./04-test-agents.md#6--healer)).
8. **Check the tests are stable** by running each one 5 times: `npx playwright test <tests>/<feature> --repeat-each=5`. Any failure means the test is flaky. Fix it before merging.
9. **Open a pull request** with the plan and the tests. The reviewer uses the checklist in [07 §3](./07-ci-governance-security.md#3-review-checklist-for-ai-generated-tests).

**Done when:** every test passes 5 times in a row locally, CI is green, and a reviewer has approved.

---

## Recipe 2 — Turn a bug report into a permanent test

**When:** someone reports a bug, and you want proof of it now, plus a test that stops it from coming back.
**Tools:** Playwright MCP (in a chat) or Playwright CLI (in a coding agent), then the Planner and Generator.

1. **Reproduce the bug with evidence.** Ask the AI precisely:
   ```text
   Use the playwright tools. Start <signed out | logged in as a test user with role X> at <baseURL><path>.
   Do the following: <steps from the bug report>.
   Report: the final URL, any error or status message shown on the page, browser console errors,
   and every network call to <API path> with its status code. Take one screenshot as evidence.
   Do not change anything else.
   ```
2. **Agree the correct behavior** with the product owner. "What should happen instead?" must be clear before you write a test.
3. **Ask the Planner to add one scenario** for the correct behavior to the relevant plan, then the **Generator** to write the test.
4. **While the bug is still open, the test fails.** That is expected. Mark it so CI stays usable:
   - `test.fail()` means "this test is *expected* to fail". When the bug is fixed and the test starts passing, Playwright reports it, so you notice.
   - `test.fixme()` means "skip this test for now", with the bug ticket number in a comment.
   Use whichever your team policy says.
5. **When the bug is fixed**, remove the marker. The test must now pass.

---

## Recipe 3 — Tests fail in CI after a design change

**When:** the app's UI changed (renamed buttons, moved fields) and many tests are now red.
**Tools:** test runner, Healer.

1. **Download the HTML report** from the CI run (for example the `playwright-report` artifact in GitHub Actions), unzip it, and open it with `npx playwright show-report <folder>`. Open the trace of one failing test to see exactly what broke.
2. **Group the failures by cause.** If many tests fail on the same element (for example the "Save" button was renamed "Save changes"), **fix it once in the page object** rather than in every test.
3. **Reproduce locally:** `npx playwright test --last-failed`
4. **Ask the Healer** about each failure that remains, **one at a time**. Running several Healers at once makes them freeze.
5. **Review each Healer change** with the accept/reject table in [04 §6](./04-test-agents.md#6--healer). Reject anything that just hides the failure, such as fixed waits or weaker assertions.

---

## Recipe 4 — Quick check while you code

**When:** you're coding with an AI agent (for example Claude Code) and want to confirm your change appears correctly in the browser.
**Tools:** Playwright CLI.

```text
Use playwright-cli with a visible browser (--headed). Open <baseURL><path>.
Take a snapshot limited to 4 levels (--depth=4) and confirm the new "<button or field name>"
is present, has a readable name, and is enabled.
Then run: npx playwright test <test file for this page>. Only report the results; don't edit any files.
```

---

## Recipe 5 — Check that one user can't see another user's data

**When:** you need to verify permissions or data separation between accounts.
**Tools:** Playwright CLI named sessions. Each session is a completely separate browser with its own login.

```text
With playwright-cli:
- In session "alice" (-s=alice): log in as test user A (or register a new test user), and create <a record>.
- In session "bob" (-s=bob): log in as test user B and open <the page that lists records>.
Report whether user B can see user A's record. Then close both sessions.
```

To make this a permanent test, create two separate browser contexts in one test (`browser.newContext()`), one per user, each with its own login.

---

## Recipe 6 — Show what happens when an outside service fails

**When:** your app depends on a third-party service (payments, maps, weather, email) and you want to see how it behaves when that service is down, without waiting for a real outage.
**Tools:** Playwright CLI (to explore), then `page.route()` (in tests).

Explore:
```bash
playwright-cli open <baseURL> --headed
playwright-cli route "**/<third-party-host>/**"      # makes those requests fail; see `playwright-cli route --help` for options
playwright-cli snapshot                              # what does the page show now?
```

In a test, always fake the failure, so the result is the same every time:
```ts
await page.route('**/<third-party-host>/**', route => route.fulfill({ status: 503 }));
```

---

## Recipe 7 — Start exploration already logged in

**When:** the pages you want the AI to explore need a login, and you don't want it to log in every time.
**Tools:** `codegen`, then Playwright MCP or the CLI.

1. **Log in once and save the login.** A browser opens, you log in with a **test** account and close the window, and the login is saved to the file:
   ```powershell
   npx playwright codegen --save-storage=playwright/.auth/user.json <baseURL>/login
   ```
2. **Start from that saved login:**
   - MCP: add `--isolated --storage-state=playwright/.auth/user.json` to the server's options.
   - CLI: `playwright-cli state-load playwright/.auth/user.json`
3. **Never commit the file.** It works like a password, so keep `playwright/.auth/` in `.gitignore`. When the login expires (or the server forgets sessions, for example after a restart), repeat step 1.

---

## Recipe 8 — Automate existing manual test cases

**When:** you have manual test cases (in a spreadsheet or test management tool) and want them automated.
**Tools:** Planner, then Generator.

```text
Convert the manual test cases below into plan scenarios in the suite "<suite name>".
Check every step against the live app. If a step doesn't match what the app actually does,
mark it as an assumption instead of guessing.
<paste the test cases>
```

Then review the plan, generate the tests one scenario at a time, and run them (as in Recipe 1).

---

## Recipe 9 — Upgrade Playwright safely

**When:** a new Playwright version is out, or you need a fix from one.

1. **Upgrade the package and browsers:** `npm install -D @playwright/test@<new version>`, then `npx playwright install`
2. **Regenerate the agent files:** `npx playwright init-agents --loop=<your AI tool>`. Then run `git diff` and put your project rules back in ([04 §8](./04-test-agents.md#8-upgrading-and-customizing-agents)).
3. **Update the pinned versions** of `@playwright/mcp` and `@playwright/cli` in shared config, if you use them.
4. **Test everything:** the full suite, the seed test, and one short run each of the Planner, Generator, and Healer.
5. **Open one pull request**, for example "chore: upgrade Playwright to <new version>".

---

## Keeping a library of reusable prompts

Store prompts the team reuses in the repository (for example `docs/prompts/planner.md`, `generator.md`, `healer.md`), so everyone uses the same wording. **Keep them consistent with the agent files**: same folders, same file types, same rules. Contradictions are a common cause of failures ([08 §5](./08-troubleshooting-and-known-issues.md#5-instructions-and-settings-that-contradict-each-other)).
