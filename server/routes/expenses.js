import { Router } from 'express';
import { query } from '../db/pool.js';
import { emptyToNull, httpError } from '../lib/helpers.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const where = [];

    if (req.query.category) {
      params.push(req.query.category);
      where.push(`e.category = $${params.length}`);
    }
    if (req.query.method) {
      params.push(req.query.method);
      where.push(`e.method = $${params.length}`);
    }
    if (req.query.from) {
      params.push(req.query.from);
      where.push(`e.paid_at >= $${params.length}`);
    }
    if (req.query.to) {
      params.push(req.query.to);
      where.push(`e.paid_at <= $${params.length}`);
    }
    if (req.query.q) {
      params.push(`%${String(req.query.q).trim()}%`);
      where.push(
        `(e.category ILIKE $${params.length} OR COALESCE(e.notes, '') ILIKE $${params.length})`
      );
    }

    const sql = `
      SELECT e.*, u.name AS user_name
      FROM expenses e
      LEFT JOIN users u ON u.id = e.created_by
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY e.paid_at DESC, e.id DESC
      LIMIT 300
    `;

    const result = await query(sql, params);
    const totalAmount = result.rows.reduce((acc, row) => acc + Number(row.amount || 0), 0);

    res.json({
      data: result.rows,
      totals: {
        total: totalAmount,
        count: result.rowCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { category, amount, paid_at, method, notes } = req.body || {};
    const trimmedCategory = String(category || '').trim();
    const numAmount = Number(amount);

    if (!trimmedCategory) {
      throw httpError(400, 'El concepto o categoría es obligatorio (ej: Alquiler, Luz, Sueldos)');
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw httpError(400, 'El monto debe ser mayor a cero');
    }

    const validMethods = ['cash', 'transfer', 'card', 'check', 'other'];
    const safeMethod = validMethods.includes(method) ? method : 'cash';

    const result = await query(
      `INSERT INTO expenses (category, amount, paid_at, method, notes, created_by)
       VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6)
       RETURNING *`,
      [
        trimmedCategory,
        numAmount,
        paid_at || null,
        safeMethod,
        emptyToNull(notes),
        req.user?.id || null,
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
