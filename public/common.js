// =====================================================
// سیستم حسابداری شافی - فایل عملکردهای مشترک
// توسعه‌دهنده: موسی بعاجی
// =====================================================

// متغیرهای سراسری
let currentUser = null;
let appData = {
    customers: [],
    products: [],
    invoices: [],
    expenses: [],
    payments: [],
    exchangeRates: {},
    settings: {}
};

// تنظیمات پیش‌فرض
const defaultSettings = {
    currency: 'AED',
    language: 'fa',
    theme: 'light',
    companyName: 'شرکت شافی',
    companyAddress: 'امارات متحده عربی',
    companyPhone: '+971-XX-XXX-XXXX',
    companyEmail: 'info@shafi.ae',
    taxRate: 5,
    invoicePrefix: 'INV-',
    customerPrefix: 'CUS-',
    productPrefix: 'PRD-'
};

// نرخ‌های ارز پیش‌فرض
const defaultExchangeRates = {
    'AED_IRR': 11000,
    'AED_USD': 0.27,
    'AED_EUR': 0.24,
    'AED_CNY': 1.96,
    'USD_AED': 3.67,
    'USD_IRR': 42000,
    'USD_EUR': 0.85,
    'USD_CNY': 7.2,
    'EUR_AED': 4.17,
    'EUR_USD': 1.18,
    'EUR_IRR': 48000,
    'EUR_CNY': 8.1,
    'IRR_AED': 0.000091,
    'IRR_USD': 0.000024,
    'IRR_EUR': 0.000021,
    'IRR_CNY': 0.00017,
    'CNY_AED': 0.51,
    'CNY_USD': 0.14,
    'CNY_EUR': 0.12,
    'CNY_IRR': 5900
};

// =====================================================
// مقداردهی اولیه
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('سیستم حسابداری شافی در حال بارگذاری...');
    
    // بارگذاری تنظیمات
    loadSettings();
    
    // بارگذاری داده‌ها
    loadAppData();
    
    // بررسی وضعیت لاگین
    checkLoginStatus();
    
    // اتصال رویدادها
    attachEventListeners();
    
    // تنظیم تاریخ امروز
    setTodayDate();
    
    // بارگذاری نرخ‌های ارز
    loadExchangeRates();
    
    console.log('سیستم با موفقیت بارگذاری شد');
});

// =====================================================
// مدیریت لاگین و احراز هویت
// =====================================================

function checkLoginStatus() {
    const savedUser = localStorage.getItem('shafi_user');
    const loginPage = document.getElementById('login-page');
    const app = document.getElementById('app');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (loginPage) loginPage.classList.add('hidden');
        if (app) app.classList.remove('hidden');
        initializeApp();
    } else {
        if (loginPage) loginPage.classList.remove('hidden');
        if (app) app.classList.add('hidden');
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // اعتبارسنجی (در حالت واقعی باید از سرور بررسی شود)
    if (username === 'admin' && password === '123456') {
        currentUser = {
            id: 1,
            username: username,
            name: 'مدیر سیستم',
            role: 'admin',
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('shafi_user', JSON.stringify(currentUser));
        
        showNotification('ورود با موفقیت انجام شد', 'success');
        
        setTimeout(() => {
            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            initializeApp();
        }, 1000);
    } else {
        showNotification('نام کاربری یا رمز عبور اشتباه است', 'error');
    }
}

function logout() {
    if (confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) {
        currentUser = null;
        localStorage.removeItem('shafi_user');
        
        showNotification('با موفقیت خارج شدید', 'info');
        
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

// =====================================================
// مدیریت داده‌ها و Local Storage
// =====================================================

function loadAppData() {
    try {
        const savedData = localStorage.getItem('shafi_data');
        if (savedData) {
            appData = { ...appData, ...JSON.parse(savedData) };
        }
        
        // اطمینان از وجود آرایه‌های ضروری
        if (!appData.customers) appData.customers = [];
        if (!appData.products) appData.products = [];
        if (!appData.invoices) appData.invoices = [];
        if (!appData.expenses) appData.expenses = [];
        if (!appData.payments) appData.payments = [];
        if (!appData.exchangeRates) appData.exchangeRates = { ...defaultExchangeRates };
        
        console.log('داده‌ها بارگذاری شد:', appData);
    } catch (error) {
        console.error('خطا در بارگذاری داده‌ها:', error);
        showNotification('خطا در بارگذاری داده‌ها', 'error');
    }
}

function saveAppData() {
    try {
        localStorage.setItem('shafi_data', JSON.stringify(appData));
        console.log('داده‌ها ذخیره شد');
    } catch (error) {
        console.error('خطا در ذخیره داده‌ها:', error);
        showNotification('خطا در ذخیره داده‌ها', 'error');
    }
}

function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('shafi_settings');
        if (savedSettings) {
            appData.settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
        } else {
            appData.settings = { ...defaultSettings };
        }
    } catch (error) {
        console.error('خطا در بارگذاری تنظیمات:', error);
        appData.settings = { ...defaultSettings };
    }
}

function saveSettings() {
    try {
        localStorage.setItem('shafi_settings', JSON.stringify(appData.settings));
    } catch (error) {
        console.error('خطا در ذخیره تنظیمات:', error);
    }
}

// =====================================================
// مدیریت رابط کاربری
// =====================================================

function initializeApp() {
    // بارگذاری داده‌ها در جداول
    loadDashboard();
    loadCustomersTable();
    loadProductsTable();
    loadInvoicesTable();
    loadExpensesTable();
    loadPaymentsTable();
    loadExchangeRatesTable();
    
    // نمایش نام کاربر
    const userElements = document.querySelectorAll('.user-name');
    userElements.forEach(el => {
        if (el) el.textContent = currentUser.name;
    });
}

function showSection(sectionName) {
    // مخفی کردن همه بخش‌ها
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // نمایش بخش انتخاب شده
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // تغییر حالت منوی کناری
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // بارگذاری داده‌های بخش
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'customers':
            loadCustomersTable();
            break;
        case 'products':
            loadProductsTable();
            break;
        case 'invoices':
            loadInvoicesTable();
            break;
        case 'expenses':
            loadExpensesTable();
            break;
        case 'reports':
            loadReports();
            break;
        case 'exchange':
            loadExchangeRatesTable();
            break;
        case 'payments':
            loadPaymentsTable();
            break;
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }
}

// =====================================================
// مدیریت مودال‌ها
// =====================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        
        // فوکوس روی اولین input
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        
        // پاک کردن فرم
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// =====================================================
// سیستم نوتیفیکیشن
// =====================================================

function showNotification(message, type = 'info', duration = 3000) {
    // حذف نوتیفیکیشن‌های قبلی
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // ایجاد نوتیفیکیشن جدید
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // آیکون بر اساس نوع
    let icon = '';
    switch(type) {
        case 'success': icon = '✅'; break;
        case 'error': icon = '❌'; break;
        case 'warning': icon = '⚠️'; break;
        case 'info': icon = 'ℹ️'; break;
        default: icon = 'ℹ️';
    }
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // اضافه کردن به صفحه
    document.body.appendChild(notification);
    
    // نمایش با انیمیشن
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // حذف خودکار
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, duration);
}

// =====================================================
// توابع کمکی
// =====================================================

function generateUniqueId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentDateTime() {
    return new Date().toISOString();
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount, currency = 'AED') {
    if (isNaN(amount)) return '0';
    
    const formatted = Number(amount).toLocaleString('fa-IR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
    
    return `${formatted} ${currency}`;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[0-9\-\(\)\s]+$/;
    return re.test(phone);
}

function setTodayDate() {
    const today = getCurrentDate();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// =====================================================
// مدیریت تبدیل ارز
// =====================================================

function loadExchangeRates() {
    const savedRates = localStorage.getItem('shafi_exchange_rates');
    if (savedRates) {
        appData.exchangeRates = { ...defaultExchangeRates, ...JSON.parse(savedRates) };
    } else {
        appData.exchangeRates = { ...defaultExchangeRates };
    }
}

function saveExchangeRates() {
    localStorage.setItem('shafi_exchange_rates', JSON.stringify(appData.exchangeRates));
}

function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        return amount;
    }
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = appData.exchangeRates[rateKey];
    
    if (rate) {
        return amount * rate;
    }
    
    // اگر نرخ مستقیم موجود نیست، از طریق USD تبدیل کنیم
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
        const toUSD = appData.exchangeRates[`${fromCurrency}_USD`];
        const fromUSD = appData.exchangeRates[`USD_${toCurrency}`];
        
        if (toUSD && fromUSD) {
            return amount * toUSD * fromUSD;
        }
    }
    
    // اگر هیچ نرخی موجود نیست، مقدار اصلی را برگردان
    console.warn(`نرخ تبدیل برای ${fromCurrency} به ${toCurrency} موجود نیست`);
    return amount;
}

function calculateExchange() {
    const amount = parseFloat(document.getElementById('exchange-amount').value) || 0;
    const fromCurrency = document.getElementById('exchange-from').value;
    const toCurrency = document.getElementById('exchange-to').value;
    
    if (amount <= 0) {
        document.getElementById('exchange-result').value = '--';
        return;
    }
    
    const result = convertCurrency(amount, fromCurrency, toCurrency);
    document.getElementById('exchange-result').value = formatCurrency(result, toCurrency);
}

function saveExchangeRate() {
    const fromCurrency = document.getElementById('rate-from').value;
    const toCurrency = document.getElementById('rate-to').value;
    const rate = parseFloat(document.getElementById('exchange-rate').value);
    
    if (!fromCurrency || !toCurrency || !rate || rate <= 0) {
        showNotification('لطفاً همه فیلدها را صحیح پر کنید', 'error');
        return;
    }
    
    if (fromCurrency === toCurrency) {
        showNotification('ارز مبدأ و مقصد نمی‌توانند یکسان باشند', 'error');
        return;
    }
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const reverseRateKey = `${toCurrency}_${fromCurrency}`;
    
    appData.exchangeRates[rateKey] = rate;
    appData.exchangeRates[reverseRateKey] = 1 / rate;
    
    saveExchangeRates();
    loadExchangeRatesTable();
    
    showNotification('نرخ ارز با موفقیت ذخیره شد', 'success');
    
    // پاک کردن فرم
    document.getElementById('exchange-rate').value = '';
}

function loadExchangeRatesTable() {
    const tableBody = document.getElementById('exchange-rates-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const rates = Object.entries(appData.exchangeRates);
    
    if (rates.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">هیچ نرخ ارزی موجود نیست</td></tr>';
        return;
    }
    
    rates.forEach(([key, rate]) => {
        const [fromCurrency, toCurrency] = key.split('_');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fromCurrency}</td>
            <td>${toCurrency}</td>
            <td>${rate.toLocaleString('fa-IR', { maximumFractionDigits: 6 })}</td>
            <td>${formatDateTime(new Date().toISOString())}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteExchangeRate('${key}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function deleteExchangeRate(rateKey) {
    if (confirm('آیا از حذف این نرخ ارز اطمینان دارید؟')) {
        delete appData.exchangeRates[rateKey];
        saveExchangeRates();
        loadExchangeRatesTable();
        showNotification('نرخ ارز حذف شد', 'success');
    }
}

// =====================================================
// مدیریت داشبورد
// =====================================================

function loadDashboard() {
    updateDashboardStats();
    loadRecentActivity();
    loadLowStockProducts();
}

function updateDashboardStats() {
    // تعداد مشتریان
    const customersCount = appData.customers.length;
    updateElement('customers-count', customersCount);
    
    // تعداد محصولات
    const productsCount = appData.products.length;
    updateElement('products-count', productsCount);
    
    // تعداد فاکتورها
    const invoicesCount = appData.invoices.length;
    updateElement('invoices-count', invoicesCount);
    
    // مجموع فروش
    const totalSales = appData.invoices
        .filter(invoice => invoice.type === 'sale' && invoice.status !== 'cancelled')
        .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    updateElement('total-sales', formatCurrency(totalSales));
}

function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function loadRecentActivity() {
    const recentInvoices = appData.invoices
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const container = document.getElementById('recent-invoices');
    if (!container) return;
    
    if (recentInvoices.length === 0) {
        container.innerHTML = '<p>هیچ فاکتور اخیری موجود نیست</p>';
        return;
    }
    
    const html = recentInvoices.map(invoice => `
        <div class="recent-item">
            <div class="recent-info">
                <strong>فاکتور ${invoice.number}</strong>
                <span>${formatDate(invoice.date)}</span>
            </div>
            <div class="recent-amount">
                ${formatCurrency(invoice.total, invoice.currency)}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function loadLowStockProducts() {
    const lowStockProducts = appData.products
        .filter(product => product.stock <= (product.minStock || 0))
        .slice(0, 5);
    
    const container = document.getElementById('low-stock-products');
    if (!container) return;
    
    if (lowStockProducts.length === 0) {
        container.innerHTML = '<p>همه محصولات موجودی کافی دارند</p>';
        return;
    }
    
    const html = lowStockProducts.map(product => `
        <div class="low-stock-item">
            <div class="product-info">
                <strong>${product.name}</strong>
                <span>کد: ${product.code}</span>
            </div>
            <div class="stock-amount ${product.stock === 0 ? 'stock-zero' : 'stock-low'}">
                ${product.stock} ${product.unit}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function refreshDashboard() {
    showNotification('در حال به‌روزرسانی داشبورد...', 'info', 1000);
    setTimeout(() => {
        loadDashboard();
        showNotification('داشبورد به‌روزرسانی شد', 'success');
    }, 1000);
}

// =====================================================
// Event Listeners
// =====================================================

function attachEventListeners() {
    // فرم لاگین
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // toggle sidebar
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // فیلدهای تبدیل ارز
    const exchangeAmount = document.getElementById('exchange-amount');
    const exchangeFrom = document.getElementById('exchange-from');
    const exchangeTo = document.getElementById('exchange-to');
    
    if (exchangeAmount) exchangeAmount.addEventListener('input', calculateExchange);
    if (exchangeFrom) exchangeFrom.addEventListener('change', calculateExchange);
    if (exchangeTo) exchangeTo.addEventListener('change', calculateExchange);
    
    // بستن مودال با کلیک خارج از آن
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // کلیدهای میانبر
    document.addEventListener('keydown', function(event) {
        // ESC برای بستن مودال
        if (event.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="flex"]');
            if (openModal) {
                openModal.style.display = 'none';
            }
        }
        
        // Ctrl+S برای ذخیره
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            saveAppData();
            showNotification('داده‌ها ذخیره شد', 'success');
        }
    });
}

// =====================================================
// توابع صادرات و واردات
// =====================================================

function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `shafi-backup-${getCurrentDate()}.json`;
    link.click();
    
    showNotification('داده‌ها صادر شد', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (confirm('آیا مطمئن هستید که می‌خواهید داده‌های فعلی را جایگزین کنید?')) {
                appData = { ...appData, ...importedData };
                saveAppData();
                initializeApp();
                showNotification('داده‌ها با موفقیت وارد شد', 'success');
            }
        } catch (error) {
            showNotification('خطا در وارد کردن داده‌ها', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
}

// =====================================================
// توابع چاپ و PDF
// =====================================================

function printInvoice(type = 'normal') {
    const printContent = document.getElementById('invoice-preview-content');
    if (!printContent) {
        showNotification('محتوای چاپ موجود نیست', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>چاپ فاکتور</title>
            <style>
                body { font-family: 'Tahoma', sans-serif; direction: rtl; }
                .invoice-preview { padding: 20px; }
                ${type === 'thermal' ? '@media print { body { width: 80mm; } }' : ''}
            </style>
        </head>
        <body>
            ${printContent.innerHTML}
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                }
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// =====================================================
// وضعیت آنلاین/آفلاین
// =====================================================

function updateOnlineStatus() {
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (navigator.onLine) {
        if (statusIndicator) statusIndicator.textContent = '🟢';
        if (statusText) statusText.textContent = 'آنلاین';
    } else {
        if (statusIndicator) statusIndicator.textContent = '🔴';
        if (statusText) statusText.textContent = 'آفلاین';
    }
}

// رویدادهای آنلاین/آفلاین
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// =====================================================
// اجرای اولیه
// =====================================================

// بررسی وضعیت آنلاین در ابتدا
updateOnlineStatus();

// ذخیره خودکار هر 30 ثانیه
setInterval(() => {
    if (currentUser) {
        saveAppData();
    }
}, 30000);

console.log('سیستم حسابداری شافی آماده است 🚀');
