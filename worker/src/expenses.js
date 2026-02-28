/**
 * Expenses API Handler - CRUD operations for user expenses
 * ADR-019: Cloud Sync for Multi-Device Access
 */
import { json } from './index.js';
import { generateId } from './helpers.js';

export async function handleExpenses(request, env, userId) {
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();

  if (request.method === 'GET' && action === 'list') return listExpenses(env, userId);
  if (request.method === 'POST' && action === 'sync') return syncExpenses(request, env, userId);
  if (request.method === 'POST' && action === 'delete') return deleteExpense(request, env, userId);

  return json({ error: 'Invalid expenses action' }, 400);
}

async function listExpenses(env, userId) {
  const expenses = await env.DB.prepare(
    'SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC'
  ).bind(userId).all();

  const history = await env.DB.prepare(
    'SELECT * FROM import_history WHERE userId = ? ORDER BY timestamp DESC'
  ).bind(userId).all();

  // Map DB field names to frontend field names
  const importHistory = history.results.map(h => ({
    ...h,
    recordsCount: h.importedCount // Frontend expects recordsCount
  }));

  return json({ expenses: expenses.results, importHistory });
}

async function syncExpenses(request, env, userId) {
  const { expenses, importHistory } = await request.json();

  // Upsert expenses
  for (const e of expenses) {
    await env.DB.prepare(`
      INSERT INTO expenses (id, userId, description, amount, date, category, businessPercent, paymentMethod, reviewed, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        description=excluded.description, amount=excluded.amount, date=excluded.date,
        category=excluded.category, businessPercent=excluded.businessPercent,
        paymentMethod=excluded.paymentMethod, reviewed=excluded.reviewed, updatedAt=excluded.updatedAt
    `).bind(e.id, userId, e.description, e.amount, e.date, e.category || 'Uncategorized',
      e.businessPercent ?? 100, e.paymentMethod || null, e.reviewed ? 1 : 0, Date.now()).run();
  }

  // Upsert import history
  for (const h of (importHistory || [])) {
    // Frontend uses recordsCount, DB uses importedCount - handle both
    const importedCount = h.importedCount ?? h.recordsCount ?? 0;
    await env.DB.prepare(`
      INSERT INTO import_history (id, userId, filename, type, importedCount, duplicatesCount, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(h.id, userId, h.filename, h.type, importedCount, h.duplicatesCount || 0, h.timestamp).run();
  }

  return json({ success: true, synced: expenses.length });
}

async function deleteExpense(request, env, userId) {
  const { id } = await request.json();
  await env.DB.prepare('DELETE FROM expenses WHERE id = ? AND userId = ?').bind(id, userId).run();
  return json({ success: true });
}
