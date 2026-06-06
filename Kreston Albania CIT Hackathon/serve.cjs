const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const maxPortAttempts = 30;

function loadEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const preferredPort = Number(process.env.PORT || 5173);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_500_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function hasSensitiveBlockedPrompt(prompt, command, context) {
  const text = `${command || ''} ${String(prompt || '')}`.toLowerCase();
  const noFinance = !Array.isArray(context.finance) || context.finance.length === 0;
  const noProposals = !Array.isArray(context.proposals) || context.proposals.length === 0;
  if (noFinance && /\b(finance|budget|revenue|profit|profitability|margin|cash flow|invoice|receivable|payable|p&l|expense|forecast|cost)\b/i.test(text)) {
    return 'finance, budget, profitability, revenue, invoice, or cost data';
  }
  if (noProposals && /\b(pipeline|proposal value|weighted pipeline|conversion rate|deal value|contract value|sales forecast)\b/i.test(text)) {
    return 'BD pipeline, proposal values, or commercial conversion data';
  }
  if (/\b(salary|salary band|private hr|employee master|compensation)\b/i.test(text) && !String(context.currentUser?.department || '').includes('HR')) {
    return 'salary bands or private HR records';
  }
  return '';
}

function fallbackCopilot(prompt, context = {}, modeNote = '') {
  const k = context.kpis || {};
  const risk = context.highRiskClients || [];
  const workload = context.workload || [];
  const tasks = context.tasks || [];
  const proposals = context.proposals || [];
  const finance = context.finance || [];
  const topRisk = risk.slice(0, 3).map(c => `• ${c.name}: risk ${c.riskScore}/100. Next action: ${c.nextAction}`).join('\n') || '• No high-risk clients are visible for this role.';
  const overloaded = workload.filter(w => w.openTasks >= 2 || w.overdue > 0).slice(0, 4).map(w => `• ${w.name} (${w.role}, ${w.department}): ${w.openTasks} open, ${w.overdue} overdue, quality ${w.avgQuality}/100`).join('\n') || '• Workload is balanced in the visible scope.';
  const review = tasks.filter(t => t.overdue || t.quality < 78 || ['Submitted', 'Under Review'].includes(t.status)).slice(0, 5).map(t => `• ${t.title} — ${t.client}, ${t.status}, owner ${t.assignee}, quality ${t.quality}/100`).join('\n') || '• No urgent review items in your visible scope.';
  const stale = proposals.length ? proposals.filter(p => p.ageDays > 14).map(p => `• ${p.client}: ${p.stage}, ${p.ageDays} days old${p.value !== undefined ? `, value €${p.value}` : ''}`).join('\n') || '• No stale proposals.' : '• BD pipeline is restricted for this role.';
  const budget = finance.length ? finance.map(f => `• ${f.department}: ${Math.round((f.actual / Math.max(1, f.budget)) * 100)}% budget used, revenue €${f.revenue}`).join('\n') : '• Finance data is restricted for this role.';

  return `${modeNote ? modeNote + '\n\n' : ''}### KrestonFlow AI — Role-Safe Management Answer\n\n**Question:** ${prompt || 'Management summary'}\n\n**Visible scope**\n• Open tasks: ${k.openTasks ?? 0}\n• Overdue tasks: ${k.overdueTasks ?? 0}\n• Submitted / under review: ${k.submittedOrReview ?? 0}\n• Weighted BD pipeline: ${k.weightedPipeline ?? 'restricted'}\n• Budget used: ${k.budgetUsedPercent ?? 'restricted'}\n\n**Client / risk priorities**\n${topRisk}\n\n**Team workload**\n${overloaded}\n\n**Quality / review queue**\n${review}\n\n**BD follow-up**\n${stale}\n\n**Finance control**\n${budget}\n\n**Recommended next actions**\n1. Review overdue and low-quality tasks before approval.\n2. Keep lower roles focused on execution and hide finance/BD/HR data.\n3. Use Senior/Manager approval before digital signature.\n4. Present the winning idea as Client 360 + hierarchy visibility + workflow automation + Gemini Copilot.`;
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map(part => part.text || '').filter(Boolean).join('\n').trim();
  return text || data?.candidates?.[0]?.output || '';
}

async function callGemini(model, apiKey, userText) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2200 }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || `Gemini request failed with HTTP ${response.status}`;
    throw new Error(`${model}: ${message}`);
  }
  const candidate = data?.candidates?.[0] || {};
  if (candidate.finishReason === 'MAX_TOKENS') {
    throw new Error(`${model}: Gemini response was incomplete because max tokens were reached`);
  }
  const answer = extractGeminiText(data);
  if (!answer) throw new Error(`${model}: Gemini returned no text`);
  return answer;
}

async function handleCopilot(req, res) {
  try {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const envModel = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
    const context = body.context || {};
    const prompt = String(body.prompt || '').slice(0, 4000);
    const command = String(body.command || '').slice(0, 80);
    const allowedCommands = Array.isArray(body.policy?.allowedCommands) ? body.policy.allowedCommands : [];

    if (command && allowedCommands.length && !allowedCommands.includes(command) && command !== 'summary') {
      return sendJson(res, 200, { mode: 'policy', provider: 'policy', answer: `Access restricted\n\nThis Copilot command is not allowed for the current role. Ask about visible tasks, workflow quality, or implementation planning instead.` });
    }

    const blocked = hasSensitiveBlockedPrompt(prompt, command, context);
    if (blocked) {
      return sendJson(res, 200, { mode: 'policy', provider: 'policy', answer: `Access restricted\n\nYour role cannot access ${blocked}. No request was sent to Gemini.\n\nAllowed alternative: ask about visible assigned tasks, workflow status, quality checks, or implementation planning.` });
    }

    if (!apiKey || apiKey.includes('PASTE_') || apiKey.length < 20) {
      return sendJson(res, 200, { mode: 'fallback', provider: 'local', answer: fallbackCopilot(prompt, context, 'Gemini key is not configured, so safe local fallback answered.') });
    }

    const system = `You are KrestonFlow AI, a professional internal CRM and workflow copilot for Kreston Albania. Use only supplied platform context. Never reveal finance, BD, HR, salary, proposal values, client portfolio, or contract data if it is not present in context or is marked restricted. Answer like a senior operations consultant. Be concise, practical, implementation-focused, and presentation-ready. Use complete sentences. Do not use markdown tables. Keep the answer short: one title, 3 to 6 bullets, and a final action plan.`;
    const userText = `${system}\n\nUser request:\n${prompt}\n\nCurrent permitted platform context JSON:\n${JSON.stringify(context, null, 2)}`;
    const models = Array.from(new Set([envModel, 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].filter(Boolean)));
    const errors = [];
    for (const model of models) {
      try {
        const answer = await callGemini(model, apiKey, userText);
        return sendJson(res, 200, { mode: 'live', provider: 'gemini', model, answer });
      } catch (err) {
        errors.push(err.message || String(err));
      }
    }
    return sendJson(res, 200, { mode: 'fallback', provider: 'local', errorNote: errors.join(' | ').slice(0, 600), answer: fallbackCopilot(prompt, context, `Live Gemini failed, so safe local fallback answered.\nLast Gemini error: ${errors[0] || 'unknown'}`) });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Copilot server error' });
  }
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, {
        ok: true,
        provider: 'gemini',
        geminiConfigured: Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').length > 20),
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/copilot') return handleCopilot(req, res);
    const cleanUrl = decodeURI(url.pathname);
    let filePath = path.join(root, cleanUrl === '/' ? 'index.html' : cleanUrl);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(root, 'index.html'), (fallbackErr, fallback) => {
          if (fallbackErr) {
            res.writeHead(404);
            return res.end('Not found');
          }
          res.writeHead(200, { 'Content-Type': mime['.html'] });
          res.end(fallback);
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

function startServer(port, attempt = 0) {
  const server = createServer();
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempt < maxPortAttempts) {
      const nextPort = port + 1;
      console.log(`Port ${port} is already in use. Trying ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }
    console.error('Could not start KrestonFlow server.');
    console.error(error.message || error);
    console.error('Tip: close old Node/terminal windows, or change PORT inside .env.');
    process.exit(1);
  });
  server.listen(port, () => {
    console.log('=====================================================');
    console.log(`KrestonFlow AI Secure Gemini Pro running at http://localhost:${port}`);
    console.log('If a browser does not open automatically, copy this link:');
    console.log(`http://localhost:${port}`);
    console.log('=====================================================');
    console.log(`Gemini configured: ${(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'YES' : 'NO - using safe local fallback'}`);
    console.log(`Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);
    console.log('Press Ctrl + C to stop.');
  });
}

startServer(preferredPort);
