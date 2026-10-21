# 01 — Environment Setup

This chapter sets up your **computer and the Playwright tooling**. It works for any web project. All the AI tools need from your application is an address they can open, the `<baseURL>`, for example `http://localhost:3000` or a staging URL. How your application is built and started is up to your project.

Each step ends with a **Verify** check. Don't continue if a check fails. Most "the agent doesn't work" problems come from a skipped step here.

## 1. Install the prerequisites

| What | Version | Why you need it | How to check |
| --- | --- | --- | --- |
| **Node.js** | 22.x, 24.x or 26.x. Choose a "LTS" (long-term support) release. | Playwright and all the AI tools are Node.js programs. Current Playwright supports only these versions ([Playwright requirements](https://playwright.dev/docs/intro#system-requirements)). | `node --version` |
| **npm** | Installed with Node.js | Installs packages, and provides `npx`, which runs a package's command | `npm --version` |
| **Operating system** | Windows 11+ / Windows Server 2019+ / WSL, macOS 14+, Debian 12/13, or Ubuntu 22.04/24.04/26.04 | Playwright's browsers support only these | — |
| **VS Code** (if your team uses GitHub Copilot) | **1.105 or newer** | Older versions can't connect the Test Agents to their tools. The agents then report "tools not found" ([Playwright docs](https://playwright.dev/docs/test-agents), [issue #37744](https://github.com/microsoft/playwright/issues/37744)). | `code --version` |
| **GitHub Copilot + Copilot Chat extensions** | Latest | Runs the AI agents inside VS Code. Your organization must allow "agent mode". | Extensions panel |
| **Claude Code** (optional, if your team uses it instead of or as well as Copilot) | Latest | Another AI host that can run the same agents | `claude --version` |
| **Git** | Any recent version | Branches and pull requests for reviewing AI changes | `git --version` |

**Working behind a company proxy or firewall?** If installs or browser downloads fail:

| Setting | What it does | Example |
| --- | --- | --- |
| `HTTPS_PROXY` | Sends npm and Playwright downloads through your company proxy | `$env:HTTPS_PROXY = "http://proxy.corp.example:8080"` |
| `NODE_EXTRA_CA_CERTS` | Trusts your company's security certificate, if the proxy inspects HTTPS traffic | `$env:NODE_EXTRA_CA_CERTS = "C:\certs\corp-root.pem"` |
| `PLAYWRIGHT_DOWNLOAD_HOST` | Downloads Playwright's browsers from an internal mirror instead of the internet | `$env:PLAYWRIGHT_DOWNLOAD_HOST = "https://artifacts.corp.example/playwright"` |

## 2. Add Playwright Test to your project

**If the project doesn't use Playwright yet:**

```powershell
npm init playwright@latest
```

This asks a few questions (TypeScript or JavaScript, test folder name, whether to add a GitHub Actions workflow, whether to download browsers), then creates `playwright.config`, an example test, and the workflow. Running it again later doesn't overwrite your tests.

**If the project already uses Playwright:**

```powershell
npm ci                              # installs exactly the versions in package-lock.json
npx playwright install chromium     # downloads the Chromium browser (or: npx playwright install  for all browsers)
```

On Linux machines and CI servers, also install the system libraries the browsers need: `npx playwright install --with-deps`.

> Use `npm ci` rather than `npm install` on shared setups. `npm ci` installs exactly what the lock file says, so everyone gets the same versions.

**Verify:**
```powershell
npx playwright --version      # shows the expected version
npx playwright test --list    # lists the tests Playwright finds, with no errors
```

## 3. Check your Playwright config

All three Test Agents read your `playwright.config.ts` (or `.js`). They need these settings:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

| Setting | What it means | Required? |
| --- | --- | --- |
| `testDir` | The folder Playwright searches for test files. Anything outside it is ignored. | Yes |
| `use.baseURL` | The address of your app. Tests and agents can then write `page.goto('/login')` instead of the full URL. | Yes. Without it, the agents don't know where your app is. |
| `use.trace` | When to record a trace (a step-by-step replay of a test). `on-first-retry` records one only when a failed test is retried. | Recommended |
| `webServer.command` | The command that starts your app. Playwright runs it before the tests. | Optional, but very useful: tests and agents then start the app themselves. |
| `webServer.url` | The address Playwright waits for before it starts testing. It can be a health-check URL. | Needed if you use `webServer` |
| `webServer.reuseExistingServer` | `true` = if your app is already running, use it instead of starting another copy. The usual setting is "reuse locally, start fresh in CI". | Recommended |
| `projects` | Which browsers or devices to test on | Yes (at least one) |

**Verify:** your app opens at the `baseURL`. Either open it in your own browser, or let `webServer` start it in the next step. If your app has a health-check endpoint, request it:
```powershell
Invoke-RestMethod <baseURL>/health        # PowerShell
curl <baseURL>/health                     # macOS / Linux
```

## 4. Create the seed test

The **seed test** is a small test that the Planner and Generator run **first**. It gives them a browser that is already in the right starting state, with your fixtures, hooks, and global setup applied ([Playwright docs](https://playwright.dev/docs/test-agents)). If your tests normally start logged in, the seed should log in too.

```ts
// tests/seed.spec.ts
import { test, expect } from '@playwright/test';   // or import from your own fixtures file

test('seed', async ({ page }) => {
  await page.goto('/');
  // Optional: log in with a fake test user, accept the cookie banner, etc.
});
```

**Verify:**
```powershell
npx playwright test tests/seed.spec.ts
```
It must pass. **If the seed test fails, every agent fails.**

## 5. Set up the Test Agents

Run the command for each AI host your team uses:

| AI host | Command | Files it creates |
| --- | --- | --- |
| VS Code + GitHub Copilot | `npx playwright init-agents --loop=vscode` | `.github/agents/playwright-test-planner.agent.md`, `…-generator.agent.md`, `…-healer.agent.md`, plus a `playwright-test` server entry in `.vscode/mcp.json` |
| Claude Code | `npx playwright init-agents --loop=claude` | The three agents under `.claude/agents/`, plus the `playwright-test` server entry in `.mcp.json` |
| OpenAI Codex | `npx playwright init-agents --loop=codex` | Codex equivalents |
| OpenCode | `npx playwright init-agents --loop=opencode` | OpenCode equivalents |

The `playwright-test` entry tells the AI host to start `npx playwright run-test-mcp-server`. That is the Playwright Test MCP server, which provides the agents' tools.

> ⚠️ Running `init-agents` again **replaces** the agent files. If your team has added its own rules to them, commit first, then compare with `git diff` afterwards. See [04 §8](./04-test-agents.md#8-upgrading-and-customizing-agents).

### 5a. Start the agents in VS Code

1. **Open the project's main folder** in VS Code: the folder that contains `node_modules` and `playwright.config`. If VS Code starts the server from a different folder, the server can't find your config ([playwright-mcp issue #1135](https://github.com/microsoft/playwright-mcp/issues/1135)).
2. **Trust the workspace** when VS Code asks. In Restricted Mode, VS Code won't start MCP servers from the project ([VS Code docs](https://code.visualstudio.com/docs/agents/run/manage-mcp-servers)).
3. **Start the server.** Open the Command Palette (`Ctrl+Shift+P`), run **MCP: List Servers**, choose **playwright-test**, then **Start Server**. You can also open `.vscode/mcp.json` and click **Start** above the entry.
4. In Copilot Chat, set the mode dropdown to **Agent**, then choose **playwright-test-planner** (or generator, or healer) from the agent list.
5. Click the **Configure Tools** icon in the chat box and check that the `playwright-test` tools are ticked.

**Verify:** ask the Planner, *"Call planner_setup_page and describe what you see."* It should describe your app's first page.

### 5b. Start the agents in Claude Code

```powershell
npx playwright init-agents --loop=claude
claude mcp list            # should show: playwright-test … connected
```

Inside Claude Code:
- `/agents` lists the three agents.
- `/mcp` shows whether each server is connected and how many tools it has.
- The first time, Claude Code asks you to **approve** servers defined in the project's `.mcp.json`. If you declined by mistake, run `claude mcp reset-project-choices` ([Claude Code docs](https://code.claude.com/docs/en/mcp)).

## 6. Set up Playwright MCP (optional)

Playwright MCP gives an AI assistant a browser for general tasks such as exploring or reproducing bugs. It is **separate** from the `playwright-test` server above. **The Test Agents don't need it.**

| AI host | How to add it |
| --- | --- |
| Any MCP-capable app | Add to its MCP settings file: `{ "mcpServers": { "playwright": { "command": "npx", "args": ["@playwright/mcp@<pinned>"] } } }` |
| VS Code | Run `code --add-mcp '{"name":"playwright","command":"npx","args":["@playwright/mcp@<pinned>"]}'`, or add the entry to `.vscode/mcp.json` under `"servers"` |
| Claude Code, just for you | `claude mcp add playwright -- npx @playwright/mcp@<pinned>` |
| Claude Code, shared with the team | `claude mcp add playwright --scope project -- npx @playwright/mcp@<pinned>`, which writes `.mcp.json` for you to commit |
| OpenAI Codex | `codex mcp add playwright npx "@playwright/mcp@<pinned>"` |
| GitHub Copilot CLI | Type `/mcp add`, or edit `~/.copilot/mcp-config.json` (the entry needs `"type": "local"` and `"tools": ["*"]`) |
| GitHub Copilot coding agent (runs on GitHub, not your PC) | Nothing to do. It's **already turned on** ([GitHub docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp)). |

**About the `--` in Claude Code commands:** everything before `--` is an option for Claude Code itself (such as `--scope`), and everything after it is the command that starts the server. Without the `--`, Claude Code tries to read the server's options (such as `--headless`) as its own and fails.

**About `<pinned>`:** in shared files, write an exact version number such as `@playwright/mcp@0.0.41` instead of `@latest`. Otherwise every teammate may silently get a different version.

**Verify:** in the chat, ask: *"Use the playwright tools to open `<baseURL>` and list the main navigation links."* A browser window should open (it's visible by default) and the AI should list the links. Recommended settings are in [02 §4–5](./02-playwright-mcp.md#4-options).

## 7. Set up Playwright CLI (optional)

The Playwright CLI lets coding agents control a browser with terminal commands. See [03](./03-playwright-cli.md) for when to choose it.

```powershell
npm install -g @playwright/cli@latest      # installs the playwright-cli command for your whole computer
playwright-cli install --skills            # teaches the AI agents in this project how to use it
```

**Verify:**
```powershell
playwright-cli open <baseURL> --headed     # a browser window opens
playwright-cli snapshot                    # prints the page's elements as text
playwright-cli close
```

The CLI runs **without a visible window by default**. `--headed` shows the window ([docs](https://playwright.dev/docs/getting-started-cli)).

## 8. Keep generated files out of Git

Add these to `.gitignore`:

```gitignore
/test-results/          # per-test output (screenshots, traces)
/playwright-report/     # HTML report
/blob-report/           # partial reports from split CI runs
/playwright/.cache/
/playwright/.auth/      # saved logins: treat these like passwords
.playwright-mcp/        # output from the MCP servers
.playwright-cli/        # output from the Playwright CLI
.env                    # local secrets
```

## 9. Platform-specific problems

| Situation | What goes wrong | What to do |
| --- | --- | --- |
| **Windows**, MCP config uses `"command": "npx"` | Some AI hosts on Windows can't start `npx`. The server never starts, with an error such as `spawn npx ENOENT`. | Use `"command": "npx.cmd"` in VS Code, or `cmd /c npx …` in other hosts. Put this in your **personal** settings, not the shared project file, because `npx.cmd` doesn't exist on macOS or Linux. |
| **Linux container** (Docker) running as the root user | Chrome refuses to start as root. The error may say "Browser is already in use", which is misleading ([issue #942](https://github.com/microsoft/playwright-mcp/issues/942)). | Add `--no-sandbox` (only in containers), and `--headless`, because containers have no screen |
| **Linux server with no screen** | A visible browser can't open | Use `--headless`, or run the MCP server on a machine that has a screen and connect to it over HTTP (`--port`) |
| **WSL** (Linux inside Windows) | The AI host runs on Windows but Node runs in WSL, or the reverse, so paths and browsers don't match | Keep everything on one side: Node, the browsers, and the AI host's server process all in WSL, or all in Windows |
| **PowerShell**, running one test file | `npx playwright test .\tests\login.spec.ts` finds no tests, because backslashes are read as a search pattern | Use forward slashes: `npx playwright test tests/login.spec.ts` |

## 10. Setup checklist

- [ ] Node.js 22 or 24 LTS installed. `npx playwright --version` shows the expected version.
- [ ] `playwright.config` has `testDir`, `baseURL`, and (recommended) `webServer`
- [ ] The app opens at `baseURL`
- [ ] The seed test passes
- [ ] `init-agents` run for each AI host the team uses, and the files committed
- [ ] The `playwright-test` server starts, and the three agents and their tools are visible
- [ ] (Optional) Playwright MCP and/or Playwright CLI installed and verified
- [ ] Generated folders are in `.gitignore`, and no secrets are in committed files
