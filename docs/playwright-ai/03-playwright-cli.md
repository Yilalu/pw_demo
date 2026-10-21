# 03 — Playwright CLI

> Terms such as *headless*, *profile*, *snapshot*, *ref*, and *storage state* are explained in [00 §3](./00-start-here.md#3-key-concepts-in-plain-language).

"Playwright CLI" can mean **two different programs**. This chapter covers both:

| | **Part 1: Agent CLI** (`@playwright/cli`) | **Part 2: Test CLI** (`npx playwright`) |
| --- | --- | --- |
| What it is | A terminal program that controls a browser one command at a time, built mainly so **AI coding agents** can use a browser | The command you use to **run your tests**, view reports, record tests, and set up the agents |
| Command name | `playwright-cli` (installed globally), or `npx playwright cli` (installed in the project) | `npx playwright` |
| Do I need AI to use it? | No, but it is designed for AI agents | No |
| What you get back | A text snapshot of the page, screenshots, recordings, generated code | Pass/fail results, an HTML report, traces |

---

# Part 1 — Agent CLI (`@playwright/cli`)

## 1.1 What it is and why it exists

With `playwright-cli`, a browser stays open in the background between commands. You (or an AI agent) send it short commands:

```bash
playwright-cli open https://staging.example.com --headed   # opens a visible browser
playwright-cli snapshot                                     # prints the page as text with refs
playwright-cli click e15                                    # clicks the element with ref e15
playwright-cli close
```

A coding agent such as Claude Code runs these commands through its normal terminal access. **Skills** are small instruction files that teach the agent these commands, and the agent loads them only when it needs them.

**Why it exists:** with MCP, the AI gets the full list of browser tools at the start of every session and a full page snapshot after every action, and all of that fills up the AI's context window. With the CLI, the page snapshot is **saved to a file** (in `.playwright-cli/`) and the AI reads it only when it needs to. Microsoft's documentation says this makes the CLI "best for coding agents" that work in large codebases ([Playwright CLI docs](https://playwright.dev/docs/getting-started-cli)).

**The trade-off:** because the page state isn't sent back automatically, the AI has to run extra commands to look at the page. In one benchmark, the CLI used about **half the tokens** of MCP but took about **twice as long**, and it was not cheaper. Read [05 §3](./05-comparison-and-decision-guide.md#3-evidence-mcp-vs-cli) before deciding.

## 1.2 Install

| Goal | Command | Notes |
| --- | --- | --- |
| Install for your whole computer | `npm install -g @playwright/cli@latest` | Then run it as `playwright-cli` |
| Install only in this project | `npm install -D @playwright/cli@latest` | Then run it as `npx playwright cli` |
| Teach AI agents in this project to use it | `playwright-cli install --skills` | Writes skill files into the project (for Claude Code: `.claude/skills/`) |
| Teach AI agents in all your projects | `playwright-cli install --skills -g` | Writes to your home folder (`~/.claude/skills`). With `--skills=agents`, writes to `~/.agents/skills` instead. |
| Use it without skills | Tell the agent: *"Run `playwright-cli --help` and use it to …"* | The agent learns the commands from the help text |

Requirement: Node.js 20 or newer ([docs](https://playwright.dev/docs/getting-started-cli)).

If `playwright-cli` is "not recognized" after a global install, npm's global folder isn't on your PATH. Run `npm config get prefix` and add that folder (or its `bin` subfolder on macOS/Linux) to PATH.

## 1.3 How commands pick an element

Most commands need a **target**, meaning which element to act on. You can give it in three ways:

| Target type | Example | When to use it |
| --- | --- | --- |
| A **ref** from the latest snapshot | `click e15` | The normal way. Run `snapshot` first, then use the ref shown next to the element. |
| A CSS selector | `click "#submit"` | If you know the element's id or class. Fragile if the page structure changes. |
| A Playwright locator | `click "getByRole('button', { name: 'Submit' })"` | The most robust choice, and the same style you'd use in a test |

## 1.4 Commands by task

**Open, move around, close**

| Command | What it does |
| --- | --- |
| `open [url]` | Starts a browser and optionally opens a URL. **Headless by default**, so add `--headed` to see the window. Other options: `--browser=chrome\|firefox\|webkit\|msedge`, `--device="iPhone 15"`, `--persistent` (keep the profile between runs), `--config=<file>`. |
| `goto <url>` | Opens a different URL in the current tab |
| `go-back` / `go-forward` / `reload` | Browser back, forward, refresh |
| `close` | Closes the browser for this session |

**See what's on the page**

| Command | What it does |
| --- | --- |
| `snapshot` | Prints the page as an accessibility snapshot with refs. `--depth=N` shows only N levels deep (shorter output, fewer tokens). `--filename=f` saves it to a file. |
| `find "<text>"` | Finds elements containing that text. `--regex` lets you use a pattern, for example `find --regex "/sign (in\|up)/i"`. |
| `screenshot [ref]` | Saves a picture of the page, or of one element. `--filename=f`, `--hires` for high resolution. |
| `pdf --filename=page.pdf` | Saves the page as a PDF |
| `console [level]` | Shows browser console messages, for example only `error` |
| `requests` / `request <n>` | Lists network requests the page made, or shows the details of one |

**Interact**

| Command | What it does |
| --- | --- |
| `click <target>` / `dblclick <target>` / `hover <target>` | Click, double-click, or move the mouse over an element |
| `fill <target> "<text>"` | Clears a text field and types into it. Add `--submit` to press Enter afterwards. |
| `type "<text>"` | Types into whatever element currently has focus |
| `press <key>` | Presses a key, for example `press Enter` or `press Tab` |
| `check <target>` / `uncheck <target>` | Ticks or unticks a checkbox |
| `select <target> <value>` | Chooses an option in a dropdown |
| `upload <file>` | Uploads a file into a file picker |
| `drag <from> <to>` | Drags one element onto another |
| `dialog-accept [text]` / `dialog-dismiss` | Clicks OK/Cancel on a browser pop-up (alert, confirm, prompt) |
| `resize <width> <height>` | Changes the window size |

**Tabs**

| Command | What it does |
| --- | --- |
| `tab-list` | Lists open tabs with their numbers |
| `tab-new [url]` / `tab-select <n>` / `tab-close [n]` | Opens a tab, switches to tab n, closes a tab |

**Logins, cookies, and saved data**

| Command | What it does |
| --- | --- |
| `state-save <file>` | Saves the current cookies and site data to a file, so you can start logged in later |
| `state-load <file>` | Loads a file saved with `state-save`, so you're logged in again |
| `cookie-list` / `cookie-get` / `cookie-set` / `cookie-delete` / `cookie-clear` | Inspect or change cookies |
| `localstorage-list` / `-get <key>` / `-set <key> <value>` / `-delete <key>` / `-clear` | Inspect or change the page's localStorage (the same commands exist with `sessionstorage-`) |

**Simulate conditions**

| Command | What it does |
| --- | --- |
| `route <url-pattern> [options]` | Intercepts matching requests and returns a fake response instead, for example to simulate a third-party service being down. Run `playwright-cli route --help` for the response options. |
| `route-list` / `unroute [pattern]` | Shows or removes active fakes |
| `set-color-scheme dark` / `set-reduced-motion` / `set-forced-colors` / `set-contrast` / `set-media` | Emulates user display settings such as dark mode or reduced motion. Each has a matching `clear-…` command. |

**Recording and debugging**

| Command | What it does |
| --- | --- |
| `tracing-start` / `tracing-stop` | Records a trace you can open in the Playwright Trace Viewer |
| `video-start [file]` / `video-chapter "<title>"` / `video-stop` | Records a video. Chapters add titled sections. `--cursor` shows the mouse. |
| `recording-start` / `recording-stop` | Records your actions and **prints the equivalent Playwright test code** |
| `generate-locator <ref>` | Suggests a robust Playwright locator for that element, ready to paste into a test |
| `highlight <ref>` | Draws a box around an element on the page |
| `eval "<javascript>"` | Runs JavaScript inside the page |
| `run-code "<playwright code>"` | Runs any Playwright code. **Powerful and risky**, so treat it like giving shell access. |

For the options of any command: `playwright-cli <command> --help`.

## 1.5 Sessions: running one or several browsers

A **session** is one running browser, with its own cookies and logins.

| You want to… | How | Example |
| --- | --- | --- |
| Use one browser (the normal case) | Just run commands. The browser lives in memory, and its logins are lost when you `close`. | `playwright-cli open <url>` |
| Keep logins after closing | Open it with `--persistent` (saved to disk), or with `--profile=<folder>` to choose where | `playwright-cli open <url> --persistent` |
| Run two separate users at the same time | Give each session a name with `-s=<name>` **on every command** | `playwright-cli -s=alice open <url>` and `playwright-cli -s=bob open <url>` |
| Make an AI agent always use one session | Set the environment variable `PLAYWRIGHT_CLI_SESSION=<name>` | `PLAYWRIGHT_CLI_SESSION=alice` |
| See which sessions exist | `playwright-cli list` | — |
| Close one or all | `-s=<name> close`, `close-all`. If something is stuck: `kill-all`. | — |
| Delete saved data | `delete-data` (default session), `-s=<name> delete-data` (named session) | — |
| Watch what the AI is doing live | `playwright-cli show` opens a dashboard of all sessions. Click a session to take over the mouse and keyboard, and press **Esc** to give control back. | — |
| Control a browser you already opened | `attach --cdp=chrome` (a running Chrome/Edge), `attach --cdp=<url>`, or `attach --extension=chrome`. `detach` lets go and leaves the browser open. | — |

**Automatic shutdown:** a headless session closes itself after **1 hour** without commands. Visible (headed) and attached browsers never close automatically. Change this with `open --idle-timeout=<milliseconds>`, where `0` means never.

## 1.6 Team settings file

Put shared defaults in `.playwright/cli.config.json`, which is loaded automatically, or pass a file with `--config`:

```json
{
  "browser": {
    "browserName": "chromium",
    "isolated": true,
    "launchOptions": { "headless": true },
    "contextOptions": { "viewport": { "width": 1280, "height": 720 } }
  },
  "network": { "allowedOrigins": ["https://staging.example.com"] },
  "outputDir": ".playwright-cli",
  "testIdAttribute": "data-testid",
  "timeouts": { "action": 5000, "navigation": 60000 }
}
```

| Setting | What it controls |
| --- | --- |
| `browser.browserName` | Which browser engine: `chromium`, `firefox`, or `webkit` |
| `browser.isolated` | `true` = start empty each time (like incognito). `false` = keep a saved profile. |
| `browser.launchOptions.headless` | `true` = invisible browser, `false` = visible window |
| `browser.contextOptions.viewport` | Window size in pixels |
| `network.allowedOrigins` | The only sites the browser may load |
| `outputDir` | Where snapshots, screenshots, and recordings are saved. Add it to `.gitignore`. |
| `testIdAttribute` | The HTML attribute your app uses for test IDs |
| `timeouts.action` / `timeouts.navigation` | Maximum time for a click or type, and for a page load (milliseconds) |

Settings can also come from environment variables beginning with `PLAYWRIGHT_MCP_` (the same names the MCP server uses), for example `PLAYWRIGHT_MCP_HEADLESS=true`.

## 1.7 What the installed skills teach the agent

Running and debugging tests · faking network responses · running Playwright code · managing sessions · saving and loading logins · generating tests (plan, generate, heal) · traces · videos · attaching screenshots and videos to pull requests with `gh` · inspecting element attributes ([Playwright CLI repository](https://github.com/microsoft/playwright-cli)).

## 1.8 When to use the Agent CLI

| Use it when | Don't use it when |
| --- | --- |
| A coding agent with terminal access is also reading and editing your code, and you want to save its context window | The AI host has no terminal (use MCP) |
| You want a quick check that a code change appears correctly in the browser | You want plans or test files that follow project conventions (use the Test Agents) |
| You need a locator, a recording, a trace, or a video to attach to a pull request | Speed matters most. It was about 2× slower than MCP in testing ([05 §3](./05-comparison-and-decision-guide.md#3-evidence-mcp-vs-cli)). |
| You need two or more separate users at the same time | — |

---

# Part 2 — Test CLI (`npx playwright`)

This is the program that **decides whether tests pass**, and it's what CI runs. No AI is involved.

## 2.1 Before running: check what will run

```powershell
npx playwright test --list
```

This lists every test Playwright found, without running anything. Use it to confirm a new test file is picked up, or that a file you *didn't* expect to run (such as a seed test) isn't included.

## 2.2 Running tests

| Goal | Command |
| --- | --- |
| Run everything | `npx playwright test` |
| Run one folder | `npx playwright test tests/checkout` |
| Run one file | `npx playwright test tests/login.spec.ts` |
| Run the test at a specific line | `npx playwright test tests/login.spec.ts:42` |
| Run tests whose title matches | `npx playwright test -g "user can sign in"` |
| Run one browser project from the config | `npx playwright test --project=chromium` |
| Watch the browser while it runs | `npx playwright test --headed` |
| Interactive UI: pick tests, watch, rewind each step | `npx playwright test --ui` |
| Step through a test line by line (Playwright Inspector) | `npx playwright test tests/login.spec.ts --debug` |
| Re-run only what failed last time | `npx playwright test --last-failed` |
| Check for flakiness: run each test 10 times | `npx playwright test --repeat-each=10` |
| Only tests affected by your changed files | `npx playwright test --only-changed=origin/main` |
| Always record a trace | `npx playwright test --trace on` |
| Record a trace only for failing tests | `npx playwright test --trace retain-on-failure` |
| Split the suite across 4 CI machines (this is machine 1) | `npx playwright test --shard=1/4` |

> **Windows / PowerShell:** always write test paths with **forward slashes** (`tests/login.spec.ts`). Playwright treats the path as a search pattern, and a backslash path such as `.\tests\login.spec.ts` may match nothing.

**Who starts the app?** If your `playwright.config` has a `webServer` section, Playwright starts the app before the tests and stops it afterwards, so you don't need to start it in another terminal. Locally, with `reuseExistingServer: true`, it reuses an app you already have running.

**Are tests independent?** Yes. Each test gets its own fresh browser context, so a login in one test does **not** carry over to the next. Shared setup belongs in fixtures, not in "test 1 logs in, test 2 uses it".

## 2.3 When a test fails

1. **Read the terminal output.** It shows the failing test's name, the assertion that failed, and a call log of what Playwright was waiting for.
2. **Open the HTML report** for full errors, logs, screenshots, and traces:
   ```powershell
   npx playwright show-report
   ```
3. **Re-run just the failures:**
   ```powershell
   npx playwright test --last-failed
   ```
4. **Get a trace locally.** Locally, retries are usually off, so `trace: 'on-first-retry'` never records anything. Force one:
   ```powershell
   npx playwright test tests/login.spec.ts --trace retain-on-failure
   ```
   Then open the report, click the failed test, and open its **trace**. You can step through every action, see the page (DOM) at each moment, and inspect network calls.
5. **Debug interactively** with the Inspector:
   ```powershell
   npx playwright test tests/login.spec.ts --debug
   ```
6. **Still stuck?** Use the Healer agent ([04 §6](./04-test-agents.md#6--healer)) or the troubleshooting tables in [08](./08-troubleshooting-and-known-issues.md).

**Where the output goes:**

| Folder | Contents | Commit to Git? |
| --- | --- | --- |
| `test-results/` | Per-test output: screenshots, videos, traces, error context | No. Add it to `.gitignore`. |
| `playwright-report/` | The HTML report | No |
| `blob-report/` | Partial reports from sharded CI runs, merged later | No |
| `playwright/.auth/` | Saved login files (storage state) | **Never.** They are effectively passwords. |

## 2.4 Reports, traces, and recording

| Goal | Command |
| --- | --- |
| Open the last HTML report | `npx playwright show-report` (or `show-report <folder>` for a downloaded CI report) |
| Open a trace file directly | `npx playwright show-trace <path-to-trace.zip>` |
| Record clicks in a browser and get test code (no AI) | `npx playwright codegen <baseURL>` |
| Log in once and save the login for later | `npx playwright codegen --save-storage=playwright/.auth/user.json <baseURL>/login` |
| Combine reports from sharded CI runs | `npx playwright merge-reports --reporter=html ./blob-report` |

## 2.5 Setup commands for the AI agents and browsers

| Goal | Command |
| --- | --- |
| Create or refresh the agent files for your AI host | `npx playwright init-agents --loop=vscode` (or `claude`, `codex`, `opencode`) |
| Start the Test MCP server manually (normally the AI host does this) | `npx playwright run-test-mcp-server` |
| Download browsers | `npx playwright install` (all) or `npx playwright install chromium` |
| Download browsers plus Linux system libraries | `npx playwright install --with-deps` |

## 2.6 How the Test CLI relates to the AI tools

- The Healer's `test_run` and `test_debug` tools use this same runner.
- A test written by the Generator is only "done" when `npx playwright test <file>` passes. **Run it yourself.**
- `codegen` is the non-AI way to create a test quickly. It records exactly what you click, and then a person tidies it up (page objects, assertions).
