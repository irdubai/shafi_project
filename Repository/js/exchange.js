// =====================================================
// API تبدیل ارز و مدیریت نرخ‌ها
// =====================================================

import { executeQuery } from '../lib/db.js';

export default async function handler(req, res) {
  // تنظیم CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    switch (req.method) {
      case 'GET':
        if (action === 'rates') {
          return await getExchangeRates(req, res);
        } else if (action === 'convert') {
          return await convertCurrency(req, res);
        }
        return await getExchangeRates(req, res);
      
      case 'POST':
        return await createExchangeRate(req, res);
      
      case 'PUT':
        return await updateExchangeRate(req, res);
      
      case 'DELETE':
        return await deleteExchangeRate(req, res);
      
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Exchange API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// دریافت نرخ‌های ارز
async function getExchangeRates(req, res) {
  const { from_currency, to_currency } = req.query;

  let query = `
    SELECT 
      id, from_currency, to_currency, rate, updated_at
    FROM exchange_rates 
    WHERE 1=1
  `;
  const params = [];

  if (from_currency) {
    query += ` AND from_currency = ?`;
    params.push(from_currency);
  }

  if (to_currency) {
    query += ` AND to_currency = ?`;
    params.push(to_currency);
  }

  query += ` ORDER BY updated_at DESC`;

  const result = await executeQuery(query, params);

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت نرخ‌های ارز',
      error: result.error
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data
  });
}

// تبدیل ارز
async function convertCurrency(req, res) {
  const { amount, from_currency, to_currency } = req.query;

  if (!amount || !from_currency || !to_currency) {
    return res.status(400).json({
      success: false,
      message: 'مبلغ، ارز مبدا و ارز مقصد الزامی است'
    });
  }

  if (from_currency === to_currency) {
    return res.status(200).json({
      success: true,
      data: {
        original_amount: parseFloat(amount),
        converted_amount: parseFloat(amount),
        from_currency,
        to_currency,
        rate: 1,
        date: new Date().toISOString()
      }
    });
  }

  // جستجوی نرخ مستقیم
  const directRate = await executeQuery(
    'SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ? ORDER BY updated_at DESC LIMIT 1',
    [from_currency, to_currency]
  );

  let rate = null;
  let convertedAmount = 0;

  if (directRate.success && directRate.data.length > 0) {
    // نرخ مستقیم موجود است
    rate = parseFloat(directRate.data[0].rate);
    convertedAmount = parseFloat(amount) * rate;
  } else {
    // جستجوی نرخ معکوس
    const reverseRate = await executeQuery(
      'SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ? ORDER BY updated_at DESC LIMIT 1',
      [to_currency, from_currency]
    );

    if (reverseRate.success && reverseRate.data.length > 0) {
      rate = 1 / parseFloat(reverseRate.data[0].rate);
      convertedAmount = parseFloat(amount) * rate;
    } else {
      // تلاش برای تبدیل از طریق USD
      const toUsdRate = await executeQuery(
        'SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = "USD" ORDER BY updated_at DESC LIMIT 1',
        [from_currency]
      );

      const fromUsdRate = await executeQuery(
        'SELECT rate FROM exchange_rates WHERE from_currency = "USD" AND to_currency = ? ORDER BY updated_at DESC LIMIT 1',
        [to_currency]
      );

      if (toUsdRate.success && toUsdRate.data.length > 0 && 
          fromUsdRate.success && fromUsdRate.data.length > 0) {
        const usdAmount = parseFloat(amount) * parseFloat(toUsdRate.data[0].rate);
        convertedAmount = usdAmount * parseFloat(fromUsdRate.data[0].rate);
        rate = parseFloat(toUsdRate.data[0].rate) * parseFloat(fromUsdRate.data[0].rate);
      } else {
        return res.status(404).json({
          success: false,
          message: 'نرخ تبدیل برای این ارزها یافت نشد'
        });
      }
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      original_amount: parseFloat(amount),
      converted_amount: convertedAmount,
      from_currency,
      to_currency,
      rate,
      date: new Date().toISOString()
    }
  });
}

// ایجاد نرخ ارز جدید
async function createExchangeRate(req, res) {
  const { from_currency, to_currency, rate } = req.body;

  // اعتبارسنجی
  if (!from_currency || !to_currency || !rate) {
    return res.status(400).json({
      success: false,
      message: 'ارز مبدا، ارز مقصد و نرخ الزامی است'
    });
  }

  if (from_currency === to_currency) {
    return res.status(400).json({
      success: false,
      message: 'ارز مبدا و مقصد نمی‌توانند یکسان باشند'
    });
  }

  if (parseFloat(rate) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'نرخ باید بزرگتر از صفر باشد'
    });
  }

  // بررسی وجود نرخ قبلی
  const existingRate = await executeQuery(
    'SELECT id FROM exchange_rates WHERE from_currency = ? AND to_currency = ?',
    [from_currency, to_currency]
  );

  if (existingRate.success && existingRate.data.length > 0) {
    // بروزرسانی نرخ موجود
    const updateResult = await executeQuery(
      'UPDATE exchange_rates SET rate = ?, updated_at = CURRENT_TIMESTAMP WHERE from_currency = ? AND to_currency = ?',
      [parseFloat(rate), from_currency, to_currency]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'خطا در بروزرسانی نرخ ارز',
        error: updateResult.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'نرخ ارز بروزرسانی شد'
    });
  } else {
    // ایجاد نرخ جدید
    const insertResult = await executeQuery(
      'INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES (?, ?, ?)',
      [from_currency, to_currency, parseFloat(rate)]
    );

    if (!insertResult.success) {
      return res.status(500).json({
        success: false,
        message: 'خطا در ایجاد نرخ ارز جدید',
        error: insertResult.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'نرخ ارز جدید ایجاد شد'
    });
  }
}

// بروزرسانی نرخ ارز
async function updateExchangeRate(req, res) {
  const { id } = req.query;
  const { rate } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه نرخ ارز الزامی است'
    });
  }

  if (!rate || parseFloat(rate) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'نرخ معتبر الزامی است'
    });
  }

  const result = await executeQuery(
    'UPDATE exchange_rates SET rate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [parseFloat(rate), id]
  );

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی نرخ ارز',
      error: result.error
    });
  }

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'نرخ ارز یافت نشد'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'نرخ ارز بروزرسانی شد'
  });
}

// حذف نرخ ارز
async function deleteExchangeRate(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'شناسه نرخ ارز الزامی است'
    });
  }

  const result = await executeQuery(
    'DELETE FROM exchange_rates WHERE id = ?',
    [id]
  );

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: 'خطا در حذف نرخ ارز',
      error: result.error
    });
  }

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'نرخ ارز یافت نشد'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'نرخ ارز حذف شد'
  });
}
