// =====================================================
// مدیریت API Calls
// =====================================================

class ApiManager {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  // تابع کمکی برای ارسال درخواست
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // API های مشتریان
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/customers${queryString ? `?${queryString}` : ''}`);
  }

  async createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  async updateCustomer(id, customerData) {
    return this.request(`/customers?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  }

  async deleteCustomer(id) {
    return this.request(`/customers?id=${id}`, {
      method: 'DELETE'
    });
  }

  // API های کالاها
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(id) {
    return this.request(`/products?id=${id}`, {
      method: 'DELETE'
    });
  }

  // API های فاکتورها
  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/invoices${queryString ? `?${queryString}` : ''}`);
  }

  async createInvoice(invoiceData) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
  }

  async updateInvoice(id, invoiceData) {
    return this.request(`/invoices?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData)
    });
  }

  async deleteInvoice(id) {
    return this.request(`/invoices?id=${id}`, {
      method: 'DELETE'
    });
  }

  // API های هزینه‌ها
  async getExpenses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/expenses${queryString ? `?${queryString}` : ''}`);
  }

  async createExpense(expenseData) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  }

  async updateExpense(id, expenseData) {
    return this.request(`/expenses?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData)
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses?id=${id}`, {
      method: 'DELETE'
    });
  }

  // API های گزارش‌ها
  async getReports(type, params = {}) {
    const queryString = new URLSearchParams({ type, ...params }).toString();
    return this.request(`/reports?${queryString}`);
  }

  async getDashboardStats() {
    return this.getReports('dashboard');
  }

  async getSalesReport(params = {}) {
    return this.getReports('sales', params);
  }

  async getProfitLossReport(params = {}) {
    return this.getReports('profit_loss', params);
  }

  // راه‌اندازی اولیه دیتابیس
  async initializeDatabase() {
    return this.request('/init');
  }
}

// ایجاد instance سراسری
window.apiManager = new ApiManager();
