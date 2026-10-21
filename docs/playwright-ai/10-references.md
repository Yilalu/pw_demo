# 10 — References

Accessed October 2026. Re-check these on every Playwright upgrade.

## Official documentation
| Topic | Link |
| --- | --- |
| Playwright Test Agents | https://playwright.dev/docs/test-agents |
| Playwright MCP (docs) | https://playwright.dev/docs/getting-started-mcp |
| Playwright CLI (docs) | https://playwright.dev/docs/getting-started-cli |
| Playwright system requirements / install | https://playwright.dev/docs/intro |
| Playwright MCP repository (options, tools, security, profiles) | https://github.com/microsoft/playwright-mcp |
| Playwright CLI repository (commands, sessions, config, skills) | https://github.com/microsoft/playwright-cli |
| VS Code custom agents | https://code.visualstudio.com/docs/copilot/customization/custom-agents |
| VS Code custom agent file reference | https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference |
| VS Code MCP servers | https://code.visualstudio.com/docs/copilot/customization/mcp-servers |
| VS Code manage/troubleshoot MCP servers | https://code.visualstudio.com/docs/agents/run/manage-mcp-servers |
| GitHub Copilot coding agent + MCP | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp |
| Claude Code MCP | https://code.claude.com/docs/en/mcp |

## Release history
| Item | Source |
| --- | --- |
| Test Agents introduced in 1.56.0; renamed "test agents" in 1.56.1; VS Code ≥ 1.105 required | Playwright 1.56 release notes (mirrored at https://releasebot.io/updates/microsoft/playwright) |

## Independent comparisons (MCP vs CLI)
| Source | Evidence level | Notes |
| --- | --- | --- |
| Ranger, "The Hidden Cost of Fewer Tokens" (Apr 2026): https://outpost.ranger.net/post/the-hidden-cost-of-fewer-tokens/ | Measured | 2 scenarios, Sonnet 4.6, rubric. CLI about ½ the tokens but about 2× slower and not cheaper. |
| Better Stack, "Playwright CLI vs. MCP": https://betterstack.com/community/guides/ai/playwright-cli-vs-mcp-browser/ | Measured (single run) | Upfront 68 vs ~3.6k tokens. Total 31k vs 35k. |
| TestCollab, "Playwright CLI": https://testcollab.com/blog/playwright-cli | Reported | The 114k vs 27k ("4×") claim, with no method or link |
| Other overviews: [bug0](https://bug0.com/blog/playwright-cli-vs-playwright-mcp-ai-browser-testing-2026), [TestDino](https://testdino.com/blog/playwright-cli-vs-mcp), [test-lab.ai](https://www.test-lab.ai/blog/playwright-mcp-vs-cli-agentic-testing) | Opinion | Background reading only |

## Upstream issues cited
| Issue | Topic |
| --- | --- |
| https://github.com/microsoft/playwright/issues/37744 | Agents can't detect tools (VS Code < 1.105) |
| https://github.com/microsoft/playwright/issues/39235 | Parallel healers hang on a shared test MCP server |
| https://github.com/microsoft/playwright/issues/42384 | `.playwright-mcp/` artifacts written to the workspace root |
| https://github.com/microsoft/playwright-mcp/issues/942 | "Browser already in use" / launch failures in containers |
| https://github.com/microsoft/playwright-mcp/issues/1135 | Server started outside the project root can't find config |
| https://github.com/openai/codex/issues/2945 | MCP client can't find `npx` |
| https://github.com/github/gh-aw/issues/16236 | Playwright MCP tools unavailable in GitHub agentic workflows |
