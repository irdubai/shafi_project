// =====================================================
// مدیریت اتصال به دیتابیس آنلاین
// =====================================================

import { connect } from '@planetscale/database';

// پیکربندی اتصال دیتابیس
const config = {
  host: process.env.DATABASE_HOST || 'aws.connect.psdb.cloud',
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch: (url, init) => {
    delete (init)["cache"];
    return fetch(url, init);
  }
};

// اتصال به دیتابیس
export const db = connect(config);

// تابع اجرای کوئری با مدیریت خطا
export async function executeQuery(query, params = []) {
  try {
    console.log('Executing query:', query.substring(0, 100) + '...');
    const result = await db.execute(query, params);
    
    return {
      success: true,
      data: result.rows || [],
      meta: result.meta || {},
      insertId: result.insertId || null,
      affectedRows: result.rowsAffected || 0
    };
  } catch (error) {
    console.error('Database Error:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      meta: {}
    };
  }
}

// تابع اجرای چندین کوئری در تراکنش
export async function executeTransaction(queries) {
  const results = [];
  
  try {
    for (const { query, params } of queries) {
      const result = await executeQuery(query, params);
      if (!result.success) {
        throw new Error(result.error);
      }
      results.push(result);
    }
    
    return {
      success: true,
      results,
      message: 'Transaction completed successfully'
    };
  } catch (error) {
    console.error('Transaction Error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

// تابع ایجاد جداول اولیه
export async function initializeTables() {
  const tables = [
    // جدول مشتریان
    {
      name: 'customers',
      query: `CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        city VARCHAR(100),
        address TEXT,
        balance_type ENUM('creditor', 'debtor') DEFAULT 'creditor',
        balance DECIMAL(15,2) DEFAULT 0,
        currency ENUM('AED', 'IRR', 'USD', 'EUR', 'CNY') DEFAULT 'AED',
        customer_type ENUM('retail', 'wholesale', 'supplier') DEFAULT 'retail',
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customer_code (customer_code),
        INDEX idx_name (name),
        INDEX idx_customer_type (customer_type),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول کالاها
    {
      name: 'products',
      query: `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        currency ENUM('AED', 'IRR', 'USD', 'EUR', 'CNY') DEFAULT 'AED',
        unit VARCHAR(50) NOT NULL,
        stock_quantity INT DEFAULT 0,
        category VARCHAR(100),
        min_stock INT DEFAULT 0,
        storage_location VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_product_code (product_code),
        INDEX idx_name (name),
        INDEX idx_category (category),
        INDEX idx_is_active (is_active),
        INDEX idx_stock_quantity (stock_quantity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول فاکتورها
    {
      name: 'invoices',
      query: `CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        type ENUM('sale', 'purchase', 'sale_return', 'purchase_return') NOT NULL,
        status ENUM('draft', 'confirmed', 'paid', 'cancelled') DEFAULT 'draft',
        customer_id INT,
        currency ENUM('AED', 'IRR', 'USD', 'EUR', 'CNY') DEFAULT 'AED',
        subtotal DECIMAL(15,2) DEFAULT 0,
        discount DECIMAL(15,2) DEFAULT 0,
        tax DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) DEFAULT 0,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        remaining DECIMAL(15,2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_invoice_number (invoice_number),
        INDEX idx_date (date),
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_customer_id (customer_id),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول آیتم‌های فاکتور
    {
      name: 'invoice_items',
      query: `CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,3) NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_invoice_id (invoice_id),
        INDEX idx_product_id (product_id),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول هزینه‌ها
    {
      name: 'expenses',
      query: `CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency ENUM('AED', 'IRR', 'USD', 'EUR', 'CNY') DEFAULT 'AED',
        category ENUM('administrative', 'transport', 'marketing', 'services', 'rent', 'supplies', 'other') NOT NULL,
        payment_method ENUM('cash', 'bank', 'card', 'check') NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_category (category),
        INDEX idx_payment_method (payment_method)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول پرداخت‌ها
    {
      name: 'payments',
      query: `CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        customer_id INT NOT NULL,
        invoice_id INT,
        amount DECIMAL(15,2) NOT NULL,
        currency ENUM('AED', 'IRR', 'USD', 'EUR', 'CNY') DEFAULT 'AED',
        payment_type ENUM('cash', 'bank', 'card', 'check', 'credit') NOT NULL,
        reference_number VARCHAR(100),
        status ENUM('confirmed', 'pending', 'cancelled', 'returned') DEFAULT 'confirmed',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_customer_id (customer_id),
        INDEX idx_invoice_id (invoice_id),
        INDEX idx_payment_type (payment_type),
        INDEX idx_status (status),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول نرخ‌های ارز
    {
      name: 'exchange_rates',
      query: `CREATE TABLE IF NOT EXISTS exchange_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_currency ENUM('AED', 'IRR', 'USD', 'EUR', 'CNY') NOT NULL,
        to_currency ENUM('AED', 'IRR', 'USD', 'EUR', 'CNY') NOT NULL,
        rate DECIMAL(15,6) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_pair (from_currency, to_currency),
        INDEX idx_from_currency (from_currency),
        INDEX idx_to_currency (to_currency)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول حساب‌ها (حسابداری پیشرفته)
    {
      name: 'accounts',
      query: `CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
        parent_id INT,
        level INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        description TEXT,
        balance DECIMAL(15,2) DEFAULT 0,
        debit_total DECIMAL(15,2) DEFAULT 0,
        credit_total DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_type (type),
        INDEX idx_parent_id (parent_id),
        INDEX idx_is_active (is_active),
        FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول اسناد حسابداری
    {
      name: 'journal_entries',
      query: `CREATE TABLE IF NOT EXISTS journal_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entry_number VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        reference VARCHAR(100),
        status ENUM('draft', 'posted', 'cancelled') DEFAULT 'draft',
        total_debit DECIMAL(15,2) DEFAULT 0,
        total_credit DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_entry_number (entry_number),
        INDEX idx_date (date),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    },

    // جدول آیتم‌های سند حسابداری
    {
      name: 'journal_items',
      query: `CREATE TABLE IF NOT EXISTS journal_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entry_id INT NOT NULL,
        account_id INT NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        description TEXT,
        debit DECIMAL(15,2) DEFAULT 0,
        credit DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_entry_id (entry_id),
        INDEX idx_account_id (account_id),
        FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    }
  ];

  const results = [];
  
  for (const table of tables) {
    try {
      console.log(`Creating table: ${table.name}`);
      const result = await executeQuery(table.query);
      
      if (result.success) {
        console.log(`✅ Table ${table.name} created successfully`);
        results.push({ table: table.name, status: 'success' });
      } else {
        console.error(`❌ Error creating table ${table.name}:`, result.error);
        results.push({ table: table.name, status: 'error', error: result.error });
      }
    } catch (error) {
      console.error(`❌ Error creating table ${table.name}:`, error);
      results.push({ table: table.name, status: 'error', error: error.message });
    }
  }

  return {
    success: results.every(r => r.status === 'success'),
    results,
    message: 'Database initialization completed'
  };
}

// تابع اضافه کردن داده‌های نمونه
export async function insertSampleData() {
  try {
    // داده‌های نمونه نرخ ارز
    const exchangeRates = [
      { from: 'AED', to: 'IRR', rate: 115000 },
      { from: 'IRR', to: 'AED', rate: 0.0000087 },
      { from: 'AED', to: 'USD', rate: 0.27 },
      { from: 'USD', to: 'AED', rate: 3.67 },
      { from: 'AED', to: 'EUR', rate: 0.25 },
      { from: 'EUR', to: 'AED', rate: 4.0 }
    ];

    for (const rate of exchangeRates) {
      await executeQuery(
        `INSERT IGNORE INTO exchange_rates (from_currency, to_currency, rate) VALUES (?, ?, ?)`,
        [rate.from, rate.to, rate.rate]
      );
    }

    console.log('✅ Sample exchange rates inserted');
    return { success: true, message: 'Sample data inserted successfully' };
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    return { success: false, error: error.message };
  }
}

// تابع بررسی اتصال دیتابیس
export async function checkConnection() {
  try {
    const result = await executeQuery('SELECT 1 as test');
    return {
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
