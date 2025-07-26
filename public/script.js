// public/script.js

// API Configuration
const API_BASE = '/api';

// Global state
let currentTab = 'dashboard';
let customers = [];
let invoices = [];

// Utility functions
function formatCurrency(amount, currency = 'AED') {
  const symbols = {
    'AED': 'د.إ',
    'USD': '$',
    'EUR': '€',
    'IRR': 'ریال'
  };
  
  return `${parseFloat(amount).toLocaleString('fa-IR')} ${symbols[currency] || currency}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fa-IR');
}

function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
  }
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="error">خطا: ${message}</div>`;
  }
}

// API functions
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'خطای سرور');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Data loading functions
async function loadCustomers() {
  try {
    customers = await apiCall('/customers');
    renderCustomers();
    updateCustomerDropdown();
  } catch (error) {
    showError('customers-list', error.message);
  }
}

async function loadInvoices() {
  try {
    invoices = await apiCall('/invoices');
    renderInvoices();
    updateDashboard();
  } catch (error) {
    showError('invoices-list', error.message);
  }
}

async function loadReport(type) {
  const targetElement = `${type}-report`;
  showLoading(targetElement);
  
  try {
    const data = await apiCall(`/reports?type=${type}`);
    renderReport(type, data);
  } catch (error) {
    showError(targetElement, error.message);
  }
}

// Rendering functions
function renderCustomers() {
  const container = document.getElementById('customers-list');
  
  if (customers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>هیچ مشتری‌ای ثبت نشده</h3>
        <p>برای شروع، مشتری جدیدی اضافه کنید</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>نام</th>
          <th>تلفن</th>
          <th>ایمیل</th>
          <th>تاریخ ثبت</th>
          <th>عملیات</th>
        </tr>
      </thead>
      <tbody>
        ${customers.map(customer => `
          <tr>
            <td>${customer.name}</td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.email || '-'}</td>
            <td>${formatDate(customer.created_at)}</td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="editCustomer(${customer.id})">ویرایش</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">حذف</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderInvoices() {
  const container = document.getElementById('invoices-list');
  
  if (invoices.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>هیچ فاکتوری ثبت نشده</h3>
        <p>برای شروع، فاکتور جدیدی ایجاد کنید</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>شماره فاکتور</th>
          <th>مشتری</th>
          <th>مبلغ</th>
          <th>ارز</th>
          <th>تاریخ</th>
          <th>عملیات</th>
        </tr>
      </thead>
      <tbody>
        ${invoices.map(invoice => `
          <tr>
            <td>#${invoice.id}</td>
            <td>${invoice.customer_name || 'نامشخص'}</td>
            <td>${formatCurrency(invoice.total_amount, invoice.invoice_currency_code)}</td>
            <td>${invoice.invoice_currency_code}</td>
            <td>${formatDate(invoice.created_at)}</td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="viewInvoice(${invoice.id})">مشاهده</button>
              <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${invoice.id})">حذف</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderReport(type, data) {
  const container = document.getElementById(`${type}-report`);
  
  switch (type) {
    case 'customer-summary':
      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>نام مشتری</th>
              <th>تعداد فاکتور</th>
              <th>مجموع فروش</th>
              <th>آخرین خرید</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(customer => `
              <tr>
                <td>${customer.name}</td>
                <td>${customer.total_invoices}</td>
                <td>${formatCurrency(customer.total_sales)}</td>
                <td>${customer.last_purchase_date ? formatDate(customer.last_purchase_date) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
      
    case 'sales-summary':
      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>تعداد فاکتور</th>
              <th>مجموع فروش</th>
              <th>ارز</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(sale => `
              <tr>
                <td>${formatDate(sale.sale_date)}</td>
                <td>${sale.total_invoices}</td>
                <td>${formatCurrency(sale.total_sales, sale.invoice_currency_code)}</td>
                <td>${sale.invoice_currency_code}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
      
    case 'top-products':
      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>نام محصول</th>
              <th>تعداد فروخته شده</th>
              <th>درآمد کل</th>
              <th>تعداد فاکتور</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(product => `
              <tr>
                <td>${product.name}</td>
                <td>${product.total_sold}</td>
                <td>${formatCurrency(product.total_revenue)}</td>
                <td>${product.invoices_count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
  }
}

function updateDashboard() {
  // Today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(inv => 
    inv.created_at.split('T')[0] === today
  );
  
  const todayTotal = todayInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
  
  document.getElementById('today-stats').innerHTML = `
    <div class="stat-item">
      <strong>${todayInvoices.length}</strong> فاکتور امروز
    </div>
    <div class="stat-item">
      <strong>${formatCurrency(todayTotal)}</strong> فروش امروز
    </div>
  `;
  
  // Customers stats
  document.getElementById('customers-stats').innerHTML = `
    <div class="stat-item">
      <strong>${customers.length}</strong> مشتری
    </div>
  `;
  
  // Recent invoices
  const recentInvoices = invoices.slice(0, 5);
  document.getElementById('recent-invoices').innerHTML = `
    ${recentInvoices.map(invoice => `
      <div class="recent-item">
        فاکتور #${invoice.id} - ${invoice.customer_name} - ${formatCurrency(invoice.total_amount, invoice.invoice_currency_code)}
      </div>
    `).join('')}
  `;
}

function updateCustomerDropdown() {
  const dropdown = document.getElementById('invoice-customer');
  dropdown.innerHTML = `
    <option value="">انتخاب مشتری...</option>
    ${customers.map(customer => `
      <option value="${customer.id}">${customer.name}</option>
    `).join('')}
  `;
}

// Modal functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// CRUD operations
async function createCustomer(customerData) {
  try {
    await apiCall('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
    
    closeModal('customer-modal');
    loadCustomers();
    alert('مشتری با موفقیت ایجاد شد');
  } catch (error) {
    alert(`خطا: ${error.message}`);
  }
}

async function createInvoice(invoiceData) {
  try {
    await apiCall('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
    
    closeModal('invoice-modal');
    loadInvoices();
    alert('فاکتور با موفقیت ایجاد شد');
  } catch (error) {
    alert(`خطا: ${error.message}`);
  }
}

async function deleteCustomer(customerId) {
  if (!confirm('آیا از حذف این مشتری اطمینان دارید؟')) return;
  
  try {
    await apiCall(`/customers?id=${customerId}`, {
      method: 'DELETE'
    });
    
    loadCustomers();
    alert('مشتری حذف شد');
  } catch (error) {
    alert(`خطا: ${error.message}`);
  }
}

async function deleteInvoice(invoiceId) {
  if (!confirm('آیا از حذف این فاکتور اطمینان دارید؟')) return;
  
  try {
    await apiCall(`/invoices?id=${invoiceId}`, {
      method: 'DELETE'
    });
    
    loadInvoices();
    alert('فاکتور حذف شد');
  } catch (error) {
    alert(`خطا: ${error.message}`);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      switchTab(tabId);
    });
  });

  // Modal close buttons
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      modal.style.display = 'none';
    });
  });

  // Window click to close modal
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });

  // Create customer button
  document.getElementById('create-customer-btn').addEventListener('click', function() {
    document.getElementById('customer-form').reset();
    document.getElementById('customer-modal-title').textContent = 'ایجاد مشتری جدید';
    openModal('customer-modal');
  });

  // Create invoice button
  document.getElementById('create-invoice-btn').addEventListener('click', function() {
    document.getElementById('invoice-form').reset();
    document.getElementById('invoice-modal-title').textContent = 'ایجاد فاکتور جدید';
    updateInvoiceTotal();
    openModal('invoice-modal');
  });

  // Customer form submit
  document.getElementById('customer-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customerData = {
      name: document.getElementById('customer-name').value,
      phone: document.getElementById('customer-phone').value,
      email: document.getElementById('customer-email').value
    };
    
    createCustomer(customerData);
  });

  // Invoice form submit
  document.getElementById('invoice-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const items = [];
    document.querySelectorAll('.invoice-item').forEach(itemEl => {
      const name = itemEl.querySelector('.item-name').value;
      const price = parseFloat(itemEl.querySelector('.item-price').value);
      const quantity = parseInt(itemEl.querySelector('.item-quantity').value);
      
      if (name && price && quantity) {
        items.push({
          product_id: 1, // Placeholder - you might need a products system
          name: name,
          price: price,
          quantity: quantity
        });
      }
    });

    if (items.length === 0) {
      alert('لطفاً حداقل یک قلم به فاکتور اضافه کنید');
      return;
    }

    const invoiceData = {
      customer_id: parseInt(document.getElementById('invoice-customer').value),
      invoice_currency_code: document.getElementById('invoice-currency').value,
      items: items
    };
    
    createInvoice(invoiceData);
  });

  // Add item button
  document.getElementById('add-item-btn').addEventListener('click', addInvoiceItem);

  // Invoice total calculation
  document.getElementById('invoice-items').addEventListener('input', updateInvoiceTotal);
  document.getElementById('invoice-currency').addEventListener('change', updateInvoiceCurrency);

  // Load initial data
  loadCustomers();
  loadInvoices();
});

function switchTab(tabId) {
  // Update navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');

  currentTab = tabId;
}

function addInvoiceItem() {
  const container = document.getElementById('invoice-items');
  const newItem = document.createElement('div');
  newItem.className = 'invoice-item';
  newItem.innerHTML = `
    <input type="text" placeholder="نام محصول" class="item-name" required>
    <input type="number" placeholder="قیمت" class="item-price" step="0.01" required>
    <input type="number" placeholder="تعداد" class="item-quantity" min="1" required>
    <button type="button" class="btn btn-danger btn-sm remove-item">حذف</button>
  `;
  
  // Add remove functionality
  newItem.querySelector('.remove-item').addEventListener('click', function() {
    newItem.remove();
    updateInvoiceTotal();
  });
  
  container.appendChild(newItem);
}

function updateInvoiceTotal() {
  let total = 0;
  document.querySelectorAll('.invoice-item').forEach(item => {
    const price = parseFloat(item.querySelector('.item-price').value) || 0;
    const quantity = parseInt(item.querySelector('.item-quantity').value) || 0;
    total += price * quantity;
  });
  
  document.getElementById('invoice-total').textContent = total.toLocaleString('fa-IR');
}

function updateInvoiceCurrency() {
  const currency = document.getElementById('invoice-currency').value;
  document.getElementById('invoice-total-currency').textContent = currency;
}

// Remove item functionality for initial item
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('remove-item')) {
    const items = document.querySelectorAll('.invoice-item');
    if (items.length > 1) {
      e.target.closest('.invoice-item').remove();
      updateInvoiceTotal();
    } else {
      alert('حداقل یک قلم باید در فاکتور وجود داشته باشد');
    }
  }
});

// Search and filter functionality
document.getElementById('invoice-search')?.addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  // Implement search logic here
});

document.getElementById('currency-filter')?.addEventListener('change', function(e) {
  const selectedCurrency = e.target.value;
  // Implement filter logic here
});

// View invoice details
async function viewInvoice(invoiceId) {
  try {
    const invoice = await apiCall(`/invoices?id=${invoiceId}`);
    
    // You can implement a detailed invoice view modal here
    alert(`فاکتور #${invoice.id}\nمشتری: ${invoice.customer_name}\nمبلغ: ${formatCurrency(invoice.total_amount, invoice.invoice_currency_code)}`);
  } catch (error) {
    alert(`خطا: ${error.message}`);
  }
}

// Edit customer functionality
async function editCustomer(customerId) {
  try {
    const customer = await apiCall(`/customers?id=${customerId}`);
    
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-phone').value = customer.phone || '';
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-modal-title').textContent = 'ویرایش مشتری';
    
    // You would need to modify the form handler to update instead of create
    openModal('customer-modal');
  } catch (error) {
    alert(`خطا: ${error.message}`);
  }
}
