// anyrouter 可用性探测 (GitHub Actions 版)
// 环境变量: ANYROUTER_KEY (必填), TG_BOT_TOKEN / TG_CHAT_ID (可选, 提供则成功时通知)
// 模型: claude-fable-5 (messages) + gpt-5.6-sol (responses)
import fs from 'node:fs';

const key = process.env.ANYROUTER_KEY;
const base = 'https://anyrouter.top';
const beta = 'context-1m-2025-08-07';
const TG_TOKEN = process.env.TG_BOT_TOKEN;
const TG_CHAT = process.env.TG_CHAT_ID;

const now = () => {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

function log(line) {
  const entry = `[${now()}] ${line}`;
  console.log(entry);
  fs.appendFileSync('probe.log', entry + '\n');
}

async function tgNotify(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text })
    });
  } catch (e) {
    console.log('TG notify failed:', e.message);
  }
}

async function probeClaude() {
  try {
    const r = await fetch(base + '/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-beta': beta
      },
      body: JSON.stringify({
        model: 'claude-fable-5',
        max_tokens: 16,
        messages: [{ role: 'user', content: 'Reply with exactly: PONG' }]
      })
    });
    const text = await r.text();
    const ok = text.includes('"content"');
    return { ok, status: r.status, body: text.slice(0, 200).replace(/\n/g, ' ') };
  } catch (e) {
    return { ok: false, status: 'ERR', body: e.message };
  }
}

async function probeGpt() {
  try {
    const r = await fetch(base + '/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-5.6-sol', input: 'hi', max_output_tokens: 16 })
    });
    const text = await r.text();
    const ok = text.includes('"output"');
    return { ok, status: r.status, body: text.slice(0, 200).replace(/\n/g, ' ') };
  } catch (e) {
    return { ok: false, status: 'ERR', body: e.message };
  }
}

const c = await probeClaude();
log(`claude claude-fable-5 -> [${c.ok ? '✔可用' : '✘'}] HTTP ${c.status}: ${c.body}`);
const g = await probeGpt();
log(`gpt   gpt-5.6-sol     -> [${g.ok ? '✔可用' : '✘'}] HTTP ${g.status}: ${g.body}`);

if (c.ok || g.ok) {
  const msg = `🎯 anyrouter 恢复可用！\nclaude-fable-5: ${c.ok ? '✔' : '✘'}\ngpt-5.6-sol: ${g.ok ? '✔' : '✘'}\n时间: ${now()}`;
  console.log('=== SUCCESS ===\n' + msg);
  await tgNotify(msg);
}