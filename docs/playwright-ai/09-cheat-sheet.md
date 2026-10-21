# 09 — Cheat Sheet

## Setup
```powershell
npm init playwright@latest                 # or: npm ci; npx playwright install
npx playwright init-agents --loop=vscode   # | claude | codex | opencode
claude mcp add playwright -- npx @playwright/mcp@<pinned> --isolated
npm i -g @playwright/cli@latest; playwright-cli install --skills
```

## Which tool?
| Need | Tool |
| --- | --- |
| Pass/fail | `npx playwright test` |
| Test plan | 🧭 Planner |
| Specs from plan | 🛠 Generator |
| Fix red tests (one at a time) | 🩹 Healer |
| AI uses a browser from a chat without terminal access, or you want the fastest answer | Playwright MCP |
| AI uses a browser during a long coding session (saves the AI's memory) | `playwright-cli` |
| No-AI scaffold | `npx playwright codegen` |

## Test CLI
```powershell
npx playwright test [path[:line]] [-g "title"] [--project=x] [--headed|--ui|--debug]
npx playwright test --last-failed | --list | --repeat-each=5 | --only-changed=origin/main
npx playwright test --trace retain-on-failure | --shard=1/4
npx playwright show-report | show-trace <zip> | codegen <url> | merge-reports
```

## Agent CLI
```bash
playwright-cli open <url> [--headed] | goto | close | list | close-all | show
playwright-cli snapshot [--depth=N] | find "text"
playwright-cli click <ref> | fill <ref> "v" [--submit] | press Enter | select <ref> v
playwright-cli screenshot | console | requests | generate-locator <ref>
playwright-cli -s=<session> … | state-save f | state-load f
playwright-cli route <pattern> | tracing-start/stop | video-start/stop | recording-start/stop
```

## MCP flags
`--isolated` · `--headless` · `--browser=chrome|firefox|webkit|msedge` · `--storage-state=f` · `--caps=vision,pdf,devtools,network,storage,testing` · `--allowed-origins=a;b` · `--viewport-size=1280,720` · `--output-dir=d` · `--idle-timeout=ms` · `--config=f.json` · `--port=n`

## Defaults to remember
| | MCP | CLI |
| --- | --- | --- |
| Window | Headed | Headless |
| Profile | Persistent on disk | In-memory |
| Idle close | 1 h (headless) | 1 h (headless) |

## Never
Real credentials · production targets · `waitForTimeout` / `networkidle` · parallel healers on one server · unpinned `@latest` in shared config · `browser_run_code_unsafe` without approval
