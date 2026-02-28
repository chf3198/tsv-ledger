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

  // Map DB fields to frontend format
  const importHistory = history.results.map(h => ({
    id: h.id,
    type: h.type,
    filename: h.filename,
    recordsCount: h.recordsCount,
    duplicatesCount: h.duplicatesCount,
    skipped: h.skipped || 0,
    dateRange: h.dateRangeEarliest ? { earliest: h.dateRangeEarliest, latest: h.dateRangeLatest } : null,
    success: h.success === 1,
    timestamp: h.timestamp
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

  // Upsert import history with all fields
  for (const h of (importHistory || [])) {
    const dateRange = h.dateRange || {};
    await env.DB.prepare(`
      INSERT INTO import_history (id, userId, filename, type, recordsCount, duplicatesCount, skipped, dateRangeEarliest, dateRangeLatest, success, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        recordsCount=excluded.recordsCount, duplicatesCount=excluded.duplicatesCount,
        skipped=excluded.skipped, dateRangeEarliest=excluded.dateRangeEarliest,
        dateRangeLatest=excluded.dateRangeLatest, success=excluded.success
    `).bind(h.id, userId, h.filename, h.type, h.recordsCount || 0, h.duplicatesCount || 0,
      h.skipped || 0, dateRange.earliest || null, dateRange.latest || null,
      h.success ? 1 : 0, h.timestamp).run();
  }

  return json({ success: true, synced: expenses.length });
}

async function deleteExpense(request, env, userId) {
  const { id } = await request.json();
  await env.DB.prepare('DELETE FROM expenses WHERE id = ? AND userId = ?').bind(id, userId).run();
  return json({ success: true });
}
