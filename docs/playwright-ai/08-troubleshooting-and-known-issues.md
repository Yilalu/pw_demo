# 08 — Troubleshooting & Known Issues

Find your symptom in the tables, then read **why it happens** and **what to do**. Where a link to a public bug report is given, the problem is known to the tool's developers. Open the link to see whether it has been fixed in a newer version.

## 1. Quick checks when nothing works

Go through these in order. Most problems are found by step 4.

| # | Check | How | What a good result looks like |
| --- | --- | --- | --- |
| 1 | Playwright is installed in the expected version | `npx playwright --version` | The version your team uses |
| 2 | The config file is valid and tests are found | `npx playwright test --list` | A list of tests, no errors |
| 3 | The seed test passes | `npx playwright test <tests>/seed.spec.<ext>` | `1 passed` |
| 4 | The app is reachable | Open `<baseURL>` in your browser, or let `webServer` start it | The app's first page loads |
| 5 | The AI tool is opened in the project's main folder | In VS Code: **File → Open Folder** on the folder containing `node_modules` and `playwright.config` | — |
| 6 | The MCP server is running and its tools are switched on | VS Code: **MCP: List Servers → (server) → Show Output**. Claude Code: `/mcp` or `claude mcp list`. | Status "running" or "connected", with a tool count above 0 |
| 7 | The agent files match your Playwright version | Did someone upgrade Playwright without re-running `init-agents`? | Agent files were regenerated after the last upgrade |

## 2. When a test fails

| Step | Do this | What you learn |
| --- | --- | --- |
| 1 | Read the terminal output | Which test failed, which check failed, and what Playwright was waiting for (the "call log") |
| 2 | `npx playwright show-report` | Full error, screenshots, and (if recorded) the trace |
| 3 | `npx playwright test --last-failed` | Whether it fails again, or only sometimes (flaky) |
| 4 | `npx playwright test <file> --trace retain-on-failure`, then open the trace from the report | A step-by-step replay: the page at each moment, every network call, every console message |
| 5 | `npx playwright test <file> --debug` | Step through the test line by line in the Playwright Inspector |
| 6 | Still unclear? Give the file, the test title, and the error output to the **Healer** | An automatic diagnosis and a proposed fix ([04 §6](./04-test-agents.md#6--healer)) |

Details on each command are in [03 §2.3](./03-playwright-cli.md#23-when-a-test-fails).

## 3. Installation and test-run problems

| What you see | Why it happens | What to do |
| --- | --- | --- |
| `Executable doesn't exist at …ms-playwright…` | The browsers for this Playwright version haven't been downloaded. This often happens right after an upgrade. | `npx playwright install` (or `npx playwright install chromium` for just one) |
| `Host system is missing dependencies` (Linux) | Linux is missing system libraries the browsers need | `npx playwright install --with-deps` |
| npm install or browser download fails on the company network | A proxy or firewall blocks it, or inspects encrypted traffic | Set `HTTPS_PROXY`, `NODE_EXTRA_CA_CERTS`, or `PLAYWRIGHT_DOWNLOAD_HOST` ([01 §1](./01-environment-setup.md#1-install-the-prerequisites)) |
| `Timed out waiting … from config.webServer` | Playwright started your app with `webServer.command`, but the app never answered at `webServer.url` | Run the command yourself and read its errors. Check that the `url` really opens. Increase `webServer.timeout` only if the app is just slow to start. |
| `… is already used` / port in use | A copy of the app is already running on that port | Stop the other copy, or set `reuseExistingServer: !process.env.CI` so Playwright uses it locally |
| The page loads but data or API calls fail | The front end started, but a back-end service it needs didn't | Start every service your app needs (or add them all to `webServer`, which accepts a list). Check each one's health URL. |
| Every request needing a login fails (401 / redirected to login) | The test isn't logged in. Each test starts with an empty browser. | Log in through a fixture, or load a saved login (`storageState`) |
| A saved login file suddenly stops working | The server forgot the session, for example after it restarted or the session expired | Create the login file again. Never commit these files. |
| A code change doesn't appear in the test | The test is hitting an old build, or a copy of the app that was already running | Rebuild or restart the app. Locally, `reuseExistingServer` may be reusing an old copy. |
| A test file path matches nothing (Windows) | Backslashes in the path are read as a search pattern | Use forward slashes: `tests/login.spec.ts` |
| Tests pass alone but fail together | Tests share data (same user, same record) or depend on running order | Give each test its own unique data, created in fixtures |
| `Node.js … is not supported` | Current Playwright supports Node.js 22, 24, or 26 only | Upgrade Node.js |

## 4. AI tool, MCP server, and agent problems

| What you see | Why it happens | What to do | More info |
| --- | --- | --- | --- |
| In VS Code, the agents say "tools not found", or all their tools are greyed out | VS Code older than 1.105 names tools differently, so the agent files can't match them | Update VS Code to 1.105 or newer, then run `init-agents` again | [issue #37744](https://github.com/microsoft/playwright/issues/37744) |
| The agent can't find its tools after someone renamed the MCP server | In the agent file, each tool is written as `<server name>/<tool>`, for example `playwright-test/test_run`. The server name must match the MCP config exactly. | Keep the server name `playwright-test`, or change the prefix on every tool in the agent files | [VS Code reference](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference) |
| "No config option or MCP root path provided", or the server can't find `playwright.config` | The server was started from a different folder than your project, for example by another extension or with a missing working-directory setting | Open the project's main folder in the AI tool, or set the server's working folder (`cwd`) to it | [playwright-mcp #1135](https://github.com/microsoft/playwright-mcp/issues/1135) |
| In VS Code, the project's MCP server never starts | The folder is in **Restricted Mode** (not trusted), and VS Code won't start project servers there | Trust the workspace when prompted. **MCP: Reset Trust** clears earlier MCP trust decisions. | [VS Code docs](https://code.visualstudio.com/docs/agents/run/manage-mcp-servers) |
| `spawn npx ENOENT`, or "program not found" | The AI tool can't find the `npx` program. This is common on Windows, and when the tool's PATH differs from your terminal's. | Windows: use `npx.cmd`, or `cmd /c npx …`. Elsewhere: make sure Node's folder is on the PATH the AI tool sees (restart the tool after installing Node). | [codex #2945](https://github.com/openai/codex/issues/2945) |
| It works for Windows users but not on Mac/Linux (or the reverse) | A shared config file contains a Windows-only command (`npx.cmd`) | Use `npx` in shared files. Windows users who need `npx.cmd` put it in their personal settings. | — |
| `claude mcp add` fails, or ignores the server's options | Claude Code read the server's options (such as `--isolated`) as its own | Put `--` before the server command: `claude mcp add playwright -- npx @playwright/mcp@<pinned> --isolated` | [Claude Code docs](https://code.claude.com/docs/en/mcp) |
| Claude Code says the server failed to start in time | The server took longer than Claude Code's startup timeout (often on the first run, while npx downloads it) | Start with a longer timeout: `MCP_TIMEOUT=20000 claude` (20 seconds) | same |
| Claude Code warns that a tool's output is too large, or cuts it off | A page snapshot was very large. Claude Code warns above 10,000 tokens and cuts off at 25,000 by default. | Ask about one part of the page, use `browser_find`, use the CLI with `snapshot --depth=N`, or (carefully) raise `MAX_MCP_OUTPUT_TOKENS` | same |
| Claude Code ignores the servers in the project's `.mcp.json` | Someone declined the "use this project's servers?" prompt | `claude mcp reset-project-choices`, then restart Claude Code and approve | same |
| "Browser is already in use … use --isolated" | **Either** another session is using the same saved browser profile (only one at a time is allowed), **or** Chrome failed to start and this misleading message is shown instead. In Linux containers, the usual causes are running as root, having no screen, or too little shared memory. | Add `--isolated`. In containers, also use `--headless`, `--no-sandbox` (only if running as root), and the Chrome option `--disable-dev-shm-usage`. To see the real error, start Chrome yourself in the same environment. | [playwright-mcp #942](https://github.com/microsoft/playwright-mcp/issues/942) |
| Several Healers were started at once. One finishes and the others freeze. | One Playwright Test MCP server can't handle several test runs at the same moment | Run Healers **one after another**. The Playwright team says running them in parallel is "not a supported scenario". | [issue #39235](https://github.com/microsoft/playwright/issues/39235) |
| A `.playwright-mcp/` folder appears in the project root | The Playwright Test MCP server saves its files in the folder it was started from, not in your configured output folder | Add `.playwright-mcp/` to `.gitignore` | [issue #42384](https://github.com/microsoft/playwright/issues/42384) |
| The Copilot coding agent (on GitHub) can't use the Playwright tools ("initialize: EOF") | The MCP server failed to start on GitHub's machine, usually because something wasn't installed | Check that `copilot-setup-steps.yml` installs dependencies and browsers. Check the repository's MCP settings. | [gh-aw #16236](https://github.com/github/gh-aw/issues/16236) |
| An invisible (headless) browser disappears after a break | MCP and the CLI close a headless browser after 1 hour without commands | Set a longer limit with `--idle-timeout=<milliseconds>`, or `0` for never | [MCP docs](https://playwright.dev/docs/getting-started-mcp) |
| The agents behave strangely after a Playwright upgrade | The agent files are from the old version and refer to tools that changed | Run `init-agents` again, then put your project rules back in | [docs](https://playwright.dev/docs/test-agents) |

## 5. Instructions and settings that contradict each other

These problems cause "it worked yesterday" failures. **Two files say different things**, so the AI follows one and Playwright follows the other. Check for them after every upgrade and whenever your conventions change.

| The contradiction | What goes wrong | How to prevent it |
| --- | --- | --- |
| The agent file says tests live in one folder, but `testDir` in `playwright.config` is a different folder | New tests are saved where Playwright doesn't look, or files you didn't expect (seed, examples) run in CI | Make the agent text match `testDir`. Check with `npx playwright test --list`. |
| Saved prompts use a different file type or folder than the agent file (for example `.ts` vs `.js`, or `tests/` vs `tests/e2e/`) | The Generator writes files in the wrong language or place | Keep the conventions in **one** place (the agent file). Prompts should refer to it, not repeat it. |
| Prompts or agent files mention files or folders that don't exist | The AI wastes time searching, or invents what the missing file "probably" contains | Search the prompts for file paths whenever files are moved or deleted |
| Two documents give opposite rules (for example, the agent file allows `test.fixme()` and the prompt forbids it) | The Healer behaves differently from run to run, and reviews keep arguing about it | Decide once, write it in the agent file, and make prompts follow it |
| `init-agents` was re-run and replaced your project rules | The agents go back to generic behavior | Keep the rules in a clearly marked section, and check `git diff` after every regeneration |
| The Copilot setup workflow's commands differ from the working CI job (typos, a missing browser install) | The Copilot coding agent can't build or test | Copy the commands from the working CI job. Run the setup workflow by hand once to test it. |
| The agent file describes how the app starts, but `webServer` actually does something else | When startup fails, the AI gives wrong advice | Describe exactly what `webServer` does |
| A Windows-only command in a shared config file | Mac and Linux users can't start the server | Use commands that work everywhere in shared files |
| Example config files contain real-looking usernames and passwords | People or the AI may use them, against the fake-data rule | Leave credential fields empty in examples. Fixtures create test users. |
| Risky tools remain in an agent's tool list (for example `browser_run_code_unsafe`) | The agent could run arbitrary code | Review the tool lists after every regeneration |

A real example of finding these problems in a repository is in [Appendix A §3](./appendix-a-reference-implementation.md#3-issues-found-in-the-reference-project).

## 6. Bad habits AI-written tests often have

| What you see in the test | Why it's a problem | Replace it with |
| --- | --- | --- |
| `page.waitForTimeout(3000)` or `waitForLoadState('networkidle')` | Fixed waits are too long when the app is fast and too short when it's slow. `networkidle` is discouraged by Playwright. | An auto-waiting check: `await expect(page.getByText('Saved')).toBeVisible()` |
| `page.locator('div > div:nth-child(3) > button')` or XPath | Breaks as soon as the page layout changes | `page.getByRole('button', { name: 'Save' })`, `getByLabel`, `getByText`, `getByTestId` |
| Checking an exact price, temperature, or date | These change by themselves, so the test fails for no real reason | Fake the response with `page.route`, or check the format: `/\$\d+\.\d{2}/` |
| Test 2 only works if test 1 ran first | Tests run in parallel and in any order | Each test creates its own data through fixtures |
| Login steps copied into every test | Slow, and every test breaks when the login page changes | A login fixture, or a saved login file (`storageState`) |
| The Healer made an assertion weaker so the test passes | The test no longer checks what it's supposed to | Undo the change, and find the real cause in the trace |

## 7. Frequently asked questions

**Do the Test Agents need Playwright MCP (`@playwright/mcp`)?**
No. They use the Playwright Test MCP server, which is built into `@playwright/test`. Playwright MCP is a separate, optional tool.

**Should I use MCP or the CLI?**
It depends on your AI tool and on what matters more, speed or saving the AI's memory. See [05](./05-comparison-and-decision-guide.md). For writing and fixing tests, use the Test Agents instead of either.

**Are AI-generated tests "real" tests?**
Yes, once a person has reviewed them, they're committed, and they pass in the test runner. After that they're ordinary Playwright tests, and no AI is involved when they run.

**Which AI model should the agents use?**
A strong coding model. Set it in the agent file's `model:` field, or leave the field out to use the model selected in the chat.

**Can we point the agents at production?**
No. Use local, dev, or staging environments with fake data ([07 §5](./07-ci-governance-security.md#5-security-model)).

**What does it cost?**
The AI usage on your Copilot or Claude plan. Measured token and cost figures are in [05 §3](./05-comparison-and-decision-guide.md#3-evidence-mcp-vs-cli).
