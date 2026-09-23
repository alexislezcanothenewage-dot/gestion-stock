import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const [
      sales,
      purchases,
      stock,
      receivable,
      payable,
      recentSales,
      topProducts,
      lowStockProducts,
      lowStockCount,
      expenses,
    ] = await Promise.all([
        query(
          `SELECT COALESCE(SUM(total), 0)::numeric AS total, COUNT(*)::int AS count
           FROM sales
           WHERE status = 'confirmed' AND issued_at >= date_trunc('month', CURRENT_DATE)`
        ),
        query(
          `SELECT COALESCE(SUM(total), 0)::numeric AS total, COUNT(*)::int AS count
           FROM purchases
           WHERE status = 'confirmed' AND issued_at >= date_trunc('month', CURRENT_DATE)`
        ),
        query(
          `SELECT COALESCE(SUM(stock_qty * cost_price), 0)::numeric AS cost_value,
                  COALESCE(SUM(stock_qty * sale_price), 0)::numeric AS sale_value
           FROM products WHERE active = true`
        ),
        query(
          `SELECT COALESCE(SUM(total - paid), 0)::numeric AS total
           FROM sales WHERE status = 'confirmed' AND total > paid`
        ),
        query(
          `SELECT COALESCE(SUM(total - paid), 0)::numeric AS total
           FROM purchases WHERE status = 'confirmed' AND total > paid`
        ),
        query(
          `SELECT s.id, s.number, s.issued_at, s.total, s.paid, s.status, c.name AS customer_name
           FROM sales s
           LEFT JOIN customers c ON c.id = s.customer_id
           ORDER BY s.created_at DESC
           LIMIT 6`
        ),
        query(
          `SELECT p.id, p.name, p.sku, p.stock_qty, p.unit, p.sale_price,
                  (SELECT a.id FROM attachments a
                   WHERE a.entity_type = 'product' AND a.entity_id = p.id AND a.kind = 'photo'
                   ORDER BY a.id LIMIT 1) AS photo_id,
                  COALESCE(SUM(si.qty), 0)::numeric AS total_qty,
                  COALESCE(SUM(si.line_total), 0)::numeric AS total_revenue
           FROM sale_items si
           JOIN sales s ON s.id = si.sale_id
           JOIN products p ON p.id = si.product_id
           WHERE s.status = 'confirmed'
           GROUP BY p.id, p.name, p.sku, p.stock_qty, p.unit, p.sale_price
           ORDER BY total_qty DESC
           LIMIT 8`
        ),
        query(
          `SELECT p.id, p.name, p.sku, p.stock_qty, p.min_stock, p.unit, p.sale_price,
                  c.name AS category_name,
                  (SELECT a.id FROM attachments a
                   WHERE a.entity_type = 'product' AND a.entity_id = p.id AND a.kind = 'photo'
                   ORDER BY a.id LIMIT 1) AS photo_id
           FROM products p
           LEFT JOIN categories c ON c.id = p.category_id
           WHERE p.active = true AND (p.stock_qty <= p.min_stock OR p.stock_qty <= 0)
           ORDER BY (p.stock_qty - p.min_stock) ASC, p.stock_qty ASC
           LIMIT 10`
        ),
        query(
          `SELECT COUNT(*)::int AS count
           FROM products
           WHERE active = true AND (stock_qty <= min_stock OR stock_qty <= 0)`
        ),
        query(
          `SELECT COALESCE(SUM(amount), 0)::numeric AS total, COUNT(*)::int AS count
           FROM expenses
           WHERE paid_at >= date_trunc('month', CURRENT_DATE)`
        ),
      ]);

    res.json({
      data: {
        salesMonth: sales.rows[0],
        purchasesMonth: purchases.rows[0],
        expensesMonth: expenses.rows[0],
        stock: stock.rows[0],
        receivable: receivable.rows[0].total,
        payable: payable.rows[0].total,
        recentSales: recentSales.rows,
        topProducts: topProducts.rows,
        lowStockProducts: lowStockProducts.rows,
        lowStockCount: lowStockCount.rows[0]?.count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
