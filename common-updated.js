// =====================================================
// مقداردهی اولیه و مدیریت ورود - نسخه آنلاین
// =====================================================

// متغیرهای سراسری
window.isOnline = true;
window.isLoading = false;
window.currentUser = null;

// بارگذاری اولیه در هنگام آماده شدن DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing online application...');
    
    // نمایش loading
    showLoading();
    
    // راه‌اندازی اولیه دیتابیس
    initializeDatabase();
    
    // بررسی وضعیت ورود
    checkAuthStatus();
    
    // اتصال event listeners
    attachEventListeners();
    
    // بررسی وضعیت اتصال
    checkOnlineStatus();
});

// راه‌اندازی دیتابیس
async function initializeDatabase() {
    try {
        console.log('Initializing database...');
        const result = await window.apiManager.initializeDatabase();
        
        if (result.success) {
            console.log('Database initialized successfully');
        } else {
            console.error('Database initialization failed:', result.message);
            showNotification('خطا در راه‌اندازی دیتابیس', 'error');
        }
    } catch (error) {
        console.error('Database initialization error:', error);
        showNotification('خطا در اتصال به دیتابیس', 'error');
    }
}

// نمایش/مخفی کردن Loading
function showLoading(message = 'در حال بارگذاری...') {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        const loadingText = loadingScreen.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
    window.isLoading = true;
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    window.isLoading = false;
}

// بررسی وضعیت اتصال
function checkOnlineStatus() {
    function updateOnlineStatus() {
        window.isOnline = navigator.onLine;
        const indicator = document.querySelector('.online-indicator');
        const status = document.querySelector('.online-status');
        
        if (indicator) {
            if (window.isOnline) {
                indicator.innerHTML = '<i class="fas fa-wifi"></i><span>متصل</span>';
                indicator.className = 'online-indicator online';
            } else {
                indicator.innerHTML = '<i class="fas fa-wifi-slash"></i><span>قطع</span>';
                indicator.className = 'online-indicator offline';
            }
        }
        
        if (status) {
            if (window.isOnline) {
                status.innerHTML = '<i class="fas fa-circle"></i><span>آنلاین</span>';
                status.className = 'online-status online';
            } else {
                status.innerHTML = '<i class="fas fa-circle"></i><span>آفلاین</span>';
                status.className = 'online-status offline';
            }
        }
    }

    // بررسی اولیه
    updateOnlineStatus();

    // اضافه کردن event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

// تابع اتصال Event Listeners
function attachEventListeners() {
    // فرم ورود
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }

    // منوی navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
                
                // بروزرسانی active class
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // دکمه منو (موبایل)
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // بستن مودال‌ها با کلیک خارج
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Escape key برای بستن مودال‌ها
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    });

    console.log('Event listeners attached');
}

// مدیریت نمایش بخش‌ها
function showSection(sectionName) {
    // مخفی کردن همه بخش‌ها
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // نمایش بخش مورد نظر
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // بارگذاری داده‌های بخش
        loadSectionData(sectionName);
    }
}

// بارگذاری داده‌های بخش
async function loadSectionData(sectionName) {
    try {
        switch (sectionName) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'customers':
                await loadCustomersData();
                break;
            case 'products':
                await loadProductsData();
                break;
            case 'invoices':
                await loadInvoicesData();
                break;
            case 'expenses':
                await loadExpensesData();
                break;
            case 'reports':
                await loadReportsData();
                break;
            case 'payments':
                await loadPaymentsData();
                break;
            case 'exchange':
                await loadExchangeData();
                break;
        }
    } catch (error) {
        console.error(`Error loading ${sectionName} data:`, error);
        showNotification(`خطا در بارگذاری داده‌های ${sectionName}`, 'error');
    }
}

// =====================================================
// مدیریت ورود و احراز هویت
// =====================================================

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('shafi_logged_in');
    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');

    if (isLoggedIn === 'true') {
        // کاربر وارد شده است
        if (loginSection) loginSection.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';

        // نمایش نام کاربر
        const username = localStorage.getItem('shafi_username') || 'مدیر سیستم';
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = username;
        }

        window.currentUser = { username };

        // بارگذاری داده‌های اولیه
        loadInitialData();
    } else {
        // کاربر وارد نشده است
        if (loginSection) loginSection.style.display = 'block';
        if (mainApp) mainApp.style.display = 'none';
    }
    
    hideLoading();
}

async function handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-button');
    const loginError = document.getElementById('loginError');

    // پاک کردن خطای قبلی
    if (loginError) {
        loginError.style.display = 'none';
        loginError.textContent = '';
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // نمایش حالت loading
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ورود...';
    }

    try {
        // شبیه‌سازی تاخیر برای بررسی
        await new Promise(resolve => setTimeout(resolve, 1000));

        // بررسی اطلاعات ورود
        if (username === 'admin' && password === '123456') {
            // ورود موفق
            localStorage.setItem('shafi_logged_in', 'true');
            localStorage.setItem('shafi_username', username);
            localStorage.setItem('shafi_login_time', new Date().toISOString());

            // نمایش پیام موفقیت
            showNotification('ورود با موفقیت انجام شد', 'success');

            // مخفی کردن فرم ورود و نمایش برنامه
            const loginSection = document.getElementById('loginSection');
            const mainApp = document.getElementById('mainApp');

            if (loginSection) loginSection.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';

            // نمایش نام کاربر
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = username;
            }

            window.currentUser = { username };

            // بارگذاری داده‌های اولیه
            await loadInitialData();

        } else {
            // ورود ناموفق
            if (loginError) {
                loginError.textContent = 'نام کاربری یا رمز عبور اشتباه است';
                loginError.style.display = 'block';
            } else {
                showNotification('نام کاربری یا رمز عبور اشتباه است', 'error');
            }

            // پاک کردن فیلد رمز عبور
            passwordInput.value = '';
            passwordInput.focus();
        }

    } catch (error) {
        console.error('Login error:', error);
        showNotification('خطا در ورود به سیستم', 'error');
    } finally {
        // برگرداندن دکمه به حالت عادی
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> ورود';
        }
    }
}

function logout() {
    if (confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) {
        // پاک کردن اطلاعات ورود
        localStorage.removeItem('shafi_logged_in');
        localStorage.removeItem('shafi_username');
        localStorage.removeItem('shafi_login_time');

        window.currentUser = null;

        // نمایش پیام
        showNotification('با موفقیت خارج شدید', 'info');

        // بارگذاری مجدد صفحه
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// =====================================================
// بارگذاری داده‌های اولیه
// =====================================================

async function loadInitialData() {
    try {
        showLoading('بارگذاری داده‌های اولیه...');
        
        // بارگذاری آمار داشبورد
        await loadDashboardData();
        
        hideLoading();
        showNotification('داده‌ها با موفقیت بارگذاری شد', 'success');
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        hideLoading();
        showNotification('خطا در بارگذاری داده‌ها', 'error');
    }
}

// =====================================================
// بارگذاری داده‌های داشبورد
// =====================================================

async function loadDashboardData() {
    try {
        const result = await window.apiManager.getDashboardStats();
        
        if (result.success) {
            updateDashboardStats(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('خطا در بارگذاری آمار داشبورد', 'error');
    }
}

function updateDashboardStats(data) {
    // بروزرسانی آمار
    const elements = {
        totalCustomers: data.customers?.total || 0,
        totalProducts: data.products?.total || 0,
        totalInvoices: data.invoices?.total || 0,
        totalSales: formatCurrency(data.invoices?.total_sales || 0)
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });

    // نمایش کالاهای کم موجود
    displayLowStockProducts(data.low_stock_products || []);
    
    // نمایش فاکتورهای اخیر
    displayRecentInvoices(data.recent_invoices || []);
}

function displayLowStockProducts(products) {
    const container = document.getElementById('lowStockProducts');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-state">همه کالاها موجودی کافی دارند</p>';
        return;
    }

    const table = `
        <table class="table">
            <thead>
                <tr>
                    <th>کد کالا</th>
                    <th>نام کالا</th>
                    <th>موجودی فعلی</th>
                    <th>حداقل موجودی</th>
                    <th>واحد</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr class="low-stock">
                        <td>${product.product_code}</td>
                        <td>${product.name}</td>
                        <td>${product.stock_quantity}</td>
                        <td>${product.min_stock}</td>
                        <td>${product.unit}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

function displayRecentInvoices(invoices) {
    const container = document.getElementById('recentInvoices');
    if (!container) return;

    if (invoices.length === 0) {
        container.innerHTML = '<p class="empty-state">فاکتور اخیری موجود نیست</p>';
        return;
    }

    const table = `
        <table class="table">
            <thead>
                <tr>
                    <th>شماره فاکتور</th>
                    <th>تاریخ</th>
                    <th>مشتری</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                </tr>
            </thead>
            <tbody>
                ${invoices.map(invoice => `
                    <tr>
                        <td>${invoice.invoice_number}</td>
                        <td>${formatDate(invoice.date)}</td>
                        <td>${invoice.customer_name || 'نامشخص'}</td>
                        <td>${formatCurrency(invoice.total)}</td>
                        <td>${getStatusBadge(invoice.status)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// =====================================================
// توابع کمکی
// =====================================================

function formatCurrency(amount, currency = 'AED') {
    const number = parseFloat(amount) || 0;
    return `${number.toLocaleString()} ${currency}`;
}

function formatDate(dateString) {
    if (!dateString) return 'نامشخص';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
}

function getStatusBadge(status) {
    const statusMap = {
        'draft': '<span class="status-badge status-warning">پیش‌نویس</span>',
        'confirmed': '<span class="status-badge status-info">تأیید شده</span>',
        'paid': '<span class="status-badge status-success">پرداخت شده</span>',
        'cancelled': '<span class="status-badge status-danger">لغو شده</span>',
        'pending': '<span class="status-badge status-warning">در انتظار</span>'
    };
    
    return statusMap[status] || `<span class="status-badge">${status}</span>`;
}

// =====================================================
// مدیریت نوتیفیکیشن‌ها
// =====================================================

function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notifications') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = getNotificationIcon(type);
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // انیمیشن ورود
    setTimeout(() => notification.classList.add('show'), 100);
    
    // حذف خودکار
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

// =====================================================
// بروزرسانی داشبورد
// =====================================================

async function refreshDashboard() {
    const refreshBtn = document.querySelector('[onclick="refreshDashboard()"]');
    
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال بروزرسانی...';
    }

    try {
        await loadDashboardData();
        showNotification('داشبورد بروزرسانی شد', 'success');
    } catch (error) {
        showNotification('خطا در بروزرسانی داشبورد', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> به‌روزرسانی';
        }
    }
}

// =====================================================
// سایر توابع بارگذاری داده‌ها
// =====================================================

async function loadCustomersData() {
    // پیاده‌سازی در فایل customer-updated.js
}

async function loadProductsData() {
    // پیاده‌سازی در فایل product-updated.js
}

async function loadInvoicesData() {
    // پیاده‌سازی در فایل invoice-updated.js
}

async function loadExpensesData() {
    // پیاده‌سازی در فایل expense-updated.js
}

async function loadReportsData() {
    // پیاده‌سازی در فایل reports.js
}

async function loadPaymentsData() {
    // پیاده‌سازی در فایل payments.js
}

async function loadExchangeData() {
    // پیاده‌سازی در فایل exchange.js
}
