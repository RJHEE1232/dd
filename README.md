# anyrouter-probe

anyrouter.top 可用性常驻探测。每小时随机时刻运行一次，检测 claude-fable-5 与 gpt-5.6-sol 是否可用，可用时通过 Telegram Bot 通知。

## 工作方式

- GitHub Actions `schedule` 每小时触发一次 workflow，内部随机 sleep 0-55 分钟，实现"每小时随机时刻"探测
- 探测结果逐条追加到 `probe.log`
- 检测到可用通道时推送 Telegram 通知（需要 `TG_BOT_TOKEN` / `TG_CHAT_ID`）
- 支持 `workflow_dispatch` 手动触发

## 仓库 Secrets

| Secret | 说明 |
|---|---|
| `ANYROUTER_KEY` | anyrouter API key（必填） |
| `TG_BOT_TOKEN` | Telegram Bot token（可选） |
| `TG_CHAT_ID` | Telegram 接收 chat id（可选） |

手动触发：Actions → anyrouter-probe → Run workflow。