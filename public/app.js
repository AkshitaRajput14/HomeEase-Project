
/* 
   HOME EASE - FRONTEND APPLICATION */

const API = "/api";

const STORAGE_KEY = "homeeaseData";
const USER_KEY = "homeeaseCurrentUser";

const demoAccounts = [
    {
        id: 1,
        name: "Demo Admin",
        email: "admin@homeease.demo",
        password: "Demo@123",
        role: "admin",
        approved: true
    },
    {
        id: 2,
        name: "Demo Professional",
        email: "professional@homeease.demo",
        password: "Demo@123",
        role: "professional",
        approved: true,
        category: "Cleaning"
    },
    {
        id: 3,
        name: "Demo Customer",
        email: "customer@homeease.demo",
        password: "Demo@123",
        role: "customer",
        approved: true
    }
];

const defaultPlans = [
    {
        id: 1,
        name: "Basic",
        price: 699,
        duration: "Monthly",
        features: ["2 service visits", "Basic maintenance", "Email support"]
    },
    {
        id: 2,
        name: "Standard",
        price: 1499,
        duration: "Monthly",
        features: ["5 service visits", "Priority booking", "Discounted repairs"]
    },
    {
        id: 3,
        name: "Premium",
        price: 11999,
        duration: "Yearly",
        features: ["Scheduled inspections", "Priority support", "Special discounts"]
    }
];

const defaultServices = [
    { id: 1, name: "Home Cleaning", price: 499, icon: "🧹" },
    { id: 2, name: "Plumbing", price: 399, icon: "🔧" },
    { id: 3, name: "Electrical Repair", price: 499, icon: "💡" },
    { id: 4, name: "AC Servicing", price: 799, icon: "❄️" },
    { id: 5, name: "Appliance Repair", price: 599, icon: "🛠️" },
    { id: 6, name: "General Maintenance", price: 499, icon: "🏠" }
];

let currentUser = null;
let currentAuthMode = "login";
let selectedPlanId = null;
let selectedService = "";
let toastTimer = null;
let plans = defaultPlans;
let services = defaultServices;


/*
   LOCAL STORAGE */

function getData() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (saved && typeof saved === "object") {
            return {
                users: Array.isArray(saved.users) ? saved.users : [],
                bookings: Array.isArray(saved.bookings) ? saved.bookings : [],
                subscriptions: Array.isArray(saved.subscriptions) ? saved.subscriptions : [],
                payments: Array.isArray(saved.payments) ? saved.payments : [],
                feedback: Array.isArray(saved.feedback) ? saved.feedback : [],
                professionals: Array.isArray(saved.professionals) ? saved.professionals : []
            };
        }
    } catch (error) {
        console.error("Could not read saved data:", error);
    }

    return {
        users: [],
        bookings: [],
        subscriptions: [],
        payments: [],
        feedback: [],
        professionals: []
    };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getAllUsers() {
    const data = getData();

    return [...demoAccounts, ...data.users];
}

function saveCurrentUser(user) {
    currentUser = user;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function restoreSession() {
    try {
        const saved = JSON.parse(localStorage.getItem(USER_KEY));

        if (saved && saved.id && saved.role) {
            currentUser = saved;
            showDashboard();
        }
    } catch (error) {
        localStorage.removeItem(USER_KEY);
    }
}


/* 
   API CONNECTION
 */

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let result;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

async function loadPublicData() {
    try {
        const [planResult, serviceResult] = await Promise.all([
            apiRequest("/plans"),
            apiRequest("/services")
        ]);

        if (Array.isArray(planResult.plans)) {
            plans = planResult.plans;
        }

        if (Array.isArray(serviceResult.services)) {
            services = serviceResult.services;
        }
    } catch (error) {
        console.warn("Using built-in demonstration data:", error.message);
    }
}


/* ==========================================
   HELPER FUNCTIONS
========================================== */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatPrice(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function makeId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function getInitial(name) {
    return String(name || "U").charAt(0).toUpperCase();
}

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function getDate() {
    return new Date().toISOString().slice(0, 10);
}

function getStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (["active", "success", "completed", "approved"].includes(value)) {
        return "active";
    }

    if (["rejected", "cancelled"].includes(value)) {
        return "rejected";
    }

    return "pending";
}

function getUserBookings() {
    const data = getData();

    return data.bookings.filter(
        booking => booking.customerId === currentUser.id
    );
}


/* ==========================================
   HOME PAGE AND NAVIGATION
========================================== */

function showHome() {
    document.getElementById("homePage").hidden = false;
    document.getElementById("dashboardPage").hidden = true;

    const navbar = document.getElementById("navbar");
    if (navbar) navbar.style.display = "block";

    const footer = document.querySelector(".footer");
    if (footer) footer.style.display = "block";

    const navActions = document.getElementById("navActions");

    if (navActions) {
        if (currentUser) {
            navActions.innerHTML = `
                <button class="btn btn-primary" onclick="showDashboard()">
                    My Dashboard
                </button>
            `;
        } else {
            navActions.innerHTML = `
                <button class="btn btn-outline" onclick="openAuth('login')">
                    Login
                </button>
                <button class="btn btn-primary" onclick="openAuth('register')">
                    Get Started
                </button>
            `;
        }
    }
}

function showDashboard() {
    if (!currentUser) {
        openAuth("login");
        return;
    }

    document.getElementById("homePage").hidden = true;
    document.getElementById("dashboardPage").hidden = false;

    const navbar = document.getElementById("navbar");
    if (navbar) navbar.style.display = "none";

    const footer = document.querySelector(".footer");
    if (footer) footer.style.display = "none";

    document.getElementById("sidebarName").textContent = currentUser.name;
    document.getElementById("sidebarRole").textContent = currentUser.role;
    document.getElementById("userAvatar").textContent = getInitial(currentUser.name);
    document.getElementById("headerAvatar").textContent = getInitial(currentUser.name);

    buildDashboardNavigation();
    renderView("overview");
}

function buildDashboardNavigation() {
    const navigation = document.getElementById("dashboardNav");

    let items = [];

    if (currentUser.role === "customer") {
        items = [
            ["overview", "🏠 Overview"],
            ["plans", "📋 Subscription Plans"],
            ["book", "🛠️ Book Service"],
            ["bookings", "📅 My Bookings"],
            ["subscriptions", "⭐ My Subscriptions"],
            ["payments", "💳 Payments"],
            ["feedback", "⭐ Feedback"]
        ];
    } else if (currentUser.role === "professional") {
        items = [
            ["overview", "🏠 Overview"],
            ["jobs", "🛠️ Available Jobs"],
            ["earnings", "💰 Earnings"]
        ];
    } else {
        items = [
            ["overview", "🏠 Overview"],
            ["professionals", "👨‍🔧 Professionals"],
            ["bookings", "📅 Bookings"],
            ["plans", "📋 Manage Plans"],
            ["payments", "💳 Payments"]
        ];
    }

    navigation.innerHTML = items.map(([view, label]) => `
        <button type="button" data-view="${view}"
            onclick="renderView('${view}')">
            ${label}
        </button>
    `).join("");
}


/* ==========================================
   AUTHENTICATION
========================================== */

function openAuth(mode = "login") {
    currentAuthMode = mode;

    const modal = document.getElementById("authModal");
    const form = document.getElementById("authForm");

    form.reset();

    document.getElementById("authMessage").textContent = "";

    const isRegister = mode === "register";

    document.getElementById("authTitle").textContent =
        isRegister ? "Create Your Account" : "Welcome Back";

    document.getElementById("authSubtitle").textContent =
        isRegister
            ? "Register to access HomeEase services."
            : "Login to your HomeEase account.";

    document.getElementById("authSubmit").textContent =
        isRegister ? "Register" : "Login";

    document.getElementById("nameGroup").hidden = !isRegister;
    document.getElementById("phoneGroup").hidden = !isRegister;
    document.getElementById("roleGroup").hidden = !isRegister;
    document.getElementById("categoryGroup").hidden = true;

    document.getElementById("authName").required = isRegister;
    document.getElementById("authPhone").required = false;

    document.getElementById("authSwitch").innerHTML = isRegister
        ? `Already have an account?
           <button type="button" onclick="switchAuth()">Login</button>`
        : `Don't have an account?
           <button type="button" onclick="switchAuth()">Register</button>`;

    modal.classList.add("show");
}

function closeAuth() {
    document.getElementById("authModal").classList.remove("show");
}

function switchAuth() {
    openAuth(currentAuthMode === "login" ? "register" : "login");
}

function updateCategoryVisibility() {
    const role = document.getElementById("authRole").value;

    document.getElementById("categoryGroup").hidden =
        !(currentAuthMode === "register" && role === "professional");
}

document.getElementById("authRole").addEventListener(
    "change",
    updateCategoryVisibility
);

async function handleAuth(event) {
    event.preventDefault();

    const message = document.getElementById("authMessage");
    const button = document.getElementById("authSubmit");

    message.textContent = "";
    button.disabled = true;
    button.textContent = "Please wait...";

    try {
        const email = document.getElementById("authEmail").value.trim().toLowerCase();
        const password = document.getElementById("authPassword").value;

        if (currentAuthMode === "register") {
            const name = document.getElementById("authName").value.trim();
            const phone = document.getElementById("authPhone").value.trim();
            const role = document.getElementById("authRole").value;
            const category = document.getElementById("authCategory").value;

            if (!name || !email || !password) {
                throw new Error("Please complete all required fields.");
            }

            const data = getData();

            const existing = getAllUsers().some(
                user => user.email.toLowerCase() === email
            );

            if (existing) {
                throw new Error("This email is already registered.");
            }

            const user = {
                id: makeId(),
                name,
                email,
                password,
                phone,
                role,
                category: role === "professional" ? category : "",
                approved: role === "customer",
                createdAt: new Date().toISOString()
            };

            data.users.push(user);

            if (role === "professional") {
                data.professionals.push({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    category: user.category,
                    approved: false
                });
            }

            saveData(data);

            // Send registration to the demo Express API.
            // Local browser storage retains the demonstration account.
            try {
                await apiRequest("/register", {
                    method: "POST",
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        password,
                        role,
                        category
                    })
                });
            } catch (error) {
                console.warn("Demo API registration:", error.message);
            }

            closeAuth();

            if (role === "professional") {
                showToast("Registration saved. Waiting for demo admin approval.");
                return;
            }

            saveCurrentUser({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            });

            showDashboard();
            showToast("Registration successful!");
        } else {
            const user = getAllUsers().find(
                item =>
                    item.email.toLowerCase() === email &&
                    item.password === password
            );

            if (!user) {
                throw new Error("Invalid email or password.");
            }

            if (user.role === "professional" && !user.approved) {
                throw new Error("Your professional account is waiting for admin approval.");
            }

            // Try demo backend login for predefined demo accounts.
            if (demoAccounts.some(item => item.id === user.id)) {
                try {
                    await apiRequest("/login", {
                        method: "POST",
                        body: JSON.stringify({ email, password })
                    });
                } catch (error) {
                    console.warn("Demo login API:", error.message);
                }
            }

            saveCurrentUser({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            });

            closeAuth();
            showDashboard();
            showToast("Login successful!");
        }
    } catch (error) {
        message.textContent = error.message;
    } finally {
        button.disabled = false;
        button.textContent = currentAuthMode === "register" ? "Register" : "Login";
    }
}

document.getElementById("authForm").addEventListener("submit", handleAuth);


/* ==========================================
   LOGOUT
========================================== */

function logout() {
    currentUser = null;
    localStorage.removeItem(USER_KEY);

    closeAuth();
    showHome();
    showToast("You have logged out.");
}


/* ==========================================
   DASHBOARD VIEW ROUTER
========================================== */

function renderView(view) {
    if (!currentUser) return;

    document.querySelectorAll(".dashboard-nav button").forEach(button => {
        button.classList.toggle("active", button.dataset.view === view);
    });

    const titles = {
        overview: "Dashboard Overview",
        plans: currentUser.role === "admin" ? "Manage Plans" : "Subscription Plans",
        book: "Book a Service",
        bookings: "Bookings",
        subscriptions: "My Subscriptions",
        payments: "Payment History",
        feedback: "Customer Feedback",
        jobs: "Available Jobs",
        earnings: "Professional Earnings",
        professionals: "Manage Professionals"
    };

    document.getElementById("dashboardTitle").textContent =
        titles[view] || "Dashboard";

    document.getElementById("dashboardWelcome").textContent =
        "Welcome, " + currentUser.name + "!";

    const content = document.getElementById("dashboardContent");

    content.innerHTML = `<div class="empty-state">Loading...</div>`;

    const views = {
        overview: renderOverview,
        plans: currentUser.role === "admin" ? renderAdminPlans : renderPlans,
        book: renderBookService,
        bookings: currentUser.role === "admin" ? renderAdminBookings : renderBookings,
        subscriptions: renderSubscriptions,
        payments: renderPayments,
        feedback: renderFeedback,
        jobs: renderJobs,
        earnings: renderEarnings,
        professionals: renderProfessionals
    };

    if (views[view]) {
        views[view]();
    }
}


/* ==========================================
   CUSTOMER OVERVIEW
========================================== */

function renderOverview() {
    const content = document.getElementById("dashboardContent");
    const data = getData();

    if (currentUser.role === "customer") {
        const bookings = getUserBookings();
        const subscriptions = data.subscriptions.filter(
            item => item.customerId === currentUser.id
        );
        const payments = data.payments.filter(
            item => item.customerId === currentUser.id
        );

        content.innerHTML = `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <p>Total Bookings</p>
                    <h3>${bookings.length}</h3>
                </div>
                <div class="stat-card">
                    <p>Subscriptions</p>
                    <h3>${subscriptions.length}</h3>
                </div>
                <div class="stat-card">
                    <p>Demo Payments</p>
                    <h3>${payments.length}</h3>
                </div>
            </div>

            <div class="content-card">
                <h3>Welcome to HomeEase</h3>
                <p>Manage your home services, subscriptions and bookings from one place.</p>
                <br>
                <button class="btn btn-primary" onclick="renderView('book')">
                    Book a Service
                </button>
                <button class="btn btn-outline" onclick="renderView('plans')">
                    Explore Plans
                </button>
            </div>
        `;
    }

    if (currentUser.role === "professional") {
        const jobs = data.bookings.filter(
            item => item.status === "Pending" ||
                item.professionalId === currentUser.id
        );

        const completed = data.bookings.filter(
            item => item.professionalId === currentUser.id &&
                item.status === "Completed"
        );

        content.innerHTML = `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <p>Available Jobs</p>
                    <h3>${jobs.length}</h3>
                </div>
                <div class="stat-card">
                    <p>Completed Jobs</p>
                    <h3>${completed.length}</h3>
                </div>
                <div class="stat-card">
                    <p>Account Status</p>
                    <h3>Active</h3>
                </div>
            </div>

            <div class="content-card">
                <h3>Professional Dashboard</h3>
                <p>View available service requests and update your job status.</p>
                <br>
                <button class="btn btn-primary" onclick="renderView('jobs')">
                    View Jobs
                </button>
            </div>
        `;
    }

    if (currentUser.role === "admin") {
        const totalRevenue = data.payments.reduce(
            (sum, item) => sum + Number(item.amount), 0
        );

        content.innerHTML = `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <p>Total Users</p>
                    <h3>${demoAccounts.length + data.users.length}</h3>
                </div>
                <div class="stat-card">
                    <p>Total Bookings</p>
                    <h3>${data.bookings.length}</h3>
                </div>
                <div class="stat-card">
                    <p>Demo Revenue</p>
                    <h3>${formatPrice(totalRevenue)}</h3>
                </div>
            </div>

            <div class="content-card">
                <h3>Admin Control Panel</h3>
                <p>Manage professionals, bookings, subscription plans and demo payment records.</p>
            </div>
        `;
    }
}


/* ==========================================
   SUBSCRIPTION PLANS
========================================== */

function renderPlans() {
    const content = document.getElementById("dashboardContent");

    content.innerHTML = `
        <div class="dashboard-plans">
            ${plans.map(plan => `
                <div class="dashboard-plan-card">
                    <h3>${escapeHTML(plan.name)}</h3>
                    <p>${escapeHTML(plan.duration)}</p>
                    <h2>${formatPrice(plan.price)}</h2>
                    <p>${(plan.features || []).map(escapeHTML).join("<br>")}</p>
                    <button class="btn btn-primary btn-block"
                        onclick="buyPlan(${Number(plan.id)})">
                        Purchase Plan
                    </button>
                </div>
            `).join("")}
        </div>
        <p class="demo-note">Demo payments only. No real money will be deducted.</p>
    `;
}

function selectPlan(id) {
    selectedPlanId = Number(id);

    if (!currentUser) {
        openAuth("login");
        showToast("Login to choose your subscription.");
        return;
    }

    if (currentUser.role !== "customer") {
        showToast("Only customers can purchase plans.");
        return;
    }

    buyPlan(id);
}

function buyPlan(id) {
    if (!currentUser || currentUser.role !== "customer") {
        showToast("Please login as a customer.");
        return;
    }

    const plan = plans.find(item => item.id === Number(id));

    if (!plan) {
        showToast("Plan not found.");
        return;
    }

    const method = prompt(
        "Choose demo payment method:\n1. Demo UPI\n2. Demo Card\n3. Demo Net Banking",
        "Demo UPI"
    );

    if (!method) return;

    const data = getData();

    const payment = {
        id: makeId(),
        customerId: currentUser.id,
        plan: plan.name,
        amount: Number(plan.price),
        method: method,
        status: "Success",
        date: getDate()
    };

    const subscription = {
        id: makeId(),
        customerId: currentUser.id,
        plan: plan.name,
        price: Number(plan.price),
        duration: plan.duration,
        status: "Active",
        purchaseDate: getDate()
    };

    data.payments.push(payment);
    data.subscriptions.push(subscription);

    saveData(data);

    // Optional backend demo request.
    apiRequest("/subscriptions/purchase", {
        method: "POST",
        headers: {
            "x-demo-user-id": String(currentUser.id)
        },
        body: JSON.stringify({
            planId: plan.id,
            method
        })
    }).catch(error => {
        console.warn("Demo purchase API:", error.message);
    });

    selectedPlanId = null;

    showToast("Demo payment successful. Plan activated!");
    renderView("subscriptions");
}


/* ==========================================
   SERVICE BOOKING
========================================== */

function selectService(name) {
    selectedService = name;

    if (!currentUser) {
        openAuth("login");
        showToast("Login to book a service.");
        return;
    }

    if (currentUser.role !== "customer") {
        showToast("Only customers can book services.");
        return;
    }

    showDashboard();
    renderView("book");
}

function renderBookService() {
    const content = document.getElementById("dashboardContent");

    content.innerHTML = `
        <div class="content-card">
            <h3>Book Your Home Service</h3>

            <form class="dashboard-form" id="bookingForm">

                <div class="form-group">
                    <label for="bookingService">Select Service</label>
                    <select id="bookingService" required>
                        <option value="">Choose a service</option>
                        ${services.map(service => `
                            <option value="${escapeHTML(service.name)}"
                                ${selectedService === service.name ? "selected" : ""}>
                                ${escapeHTML(service.name)} - ${formatPrice(service.price)}
                            </option>
                        `).join("")}
                    </select>
                </div>

                <div class="form-group">
                    <label for="bookingDate">Select Date</label>
                    <input type="date" id="bookingDate"
                        min="${getDate()}" required>
                </div>

                <div class="form-group">
                    <label for="bookingTime">Select Time</label>
                    <select id="bookingTime" required>
                        <option value="">Choose a time</option>
                        <option>09:00 AM</option>
                        <option>10:00 AM</option>
                        <option>11:00 AM</option>
                        <option>12:00 PM</option>
                        <option>02:00 PM</option>
                        <option>03:00 PM</option>
                        <option>04:00 PM</option>
                        <option>05:00 PM</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="bookingAddress">Service Address</label>
                    <textarea id="bookingAddress"
                        placeholder="Enter a sample service address" required></textarea>
                </div>

                <button type="submit" class="btn btn-primary">
                    Confirm Booking
                </button>

            </form>
        </div>
    `;

    document.getElementById("bookingForm").addEventListener("submit", createBooking);
}

async function createBooking(event) {
    event.preventDefault();

    const service = document.getElementById("bookingService").value;
    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    const address = document.getElementById("bookingAddress").value.trim();

    if (!service || !date || !time || !address) {
        showToast("Please complete all booking details.");
        return;
    }

    if (date < getDate()) {
        showToast("Please select a future date.");
        return;
    }

    const booking = {
        id: makeId(),
        customerId: currentUser.id,
        customerName: currentUser.name,
        service,
        date,
        time,
        address,
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    const data = getData();
    data.bookings.push(booking);
    saveData(data);

    // Try sending the booking to the Express demo API.
    apiRequest("/bookings", {
        method: "POST",
        headers: {
            "x-demo-user-id": String(currentUser.id)
        },
        body: JSON.stringify({ service, date, time, address })
    }).catch(error => {
        console.warn("Demo booking API:", error.message);
    });

    selectedService = "";

    showToast("Booking created successfully!");
    renderView("bookings");
}


/* ==========================================
   CUSTOMER BOOKINGS
========================================== */

function renderBookings() {
    const content = document.getElementById("dashboardContent");
    const bookings = getUserBookings();

    if (!bookings.length) {
        content.innerHTML = `
            <div class="content-card empty-state">
                <div class="empty-icon">📅</div>
                <h3>No Bookings Yet</h3>
                <p>Your service bookings will appear here.</p>
                <br>
                <button class="btn btn-primary" onclick="renderView('book')">
                    Book a Service
                </button>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="content-card">
            <h3>Your Booking History</h3>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookings.map(booking => `
                            <tr>
                                <td>${escapeHTML(booking.service)}</td>
                                <td>${escapeHTML(booking.date)}</td>
                                <td>${escapeHTML(booking.time)}</td>
                                <td>
                                    <span class="status ${getStatusClass(booking.status)}">
                                        ${escapeHTML(booking.status)}
                                    </span>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


/* ==========================================
   SUBSCRIPTION HISTORY
========================================== */

function renderSubscriptions() {
    const content = document.getElementById("dashboardContent");
    const data = getData();

    const subscriptions = data.subscriptions.filter(
        item => item.customerId === currentUser.id
    );

    if (!subscriptions.length) {
        content.innerHTML = `
            <div class="content-card empty-state">
                <div class="empty-icon">⭐</div>
                <h3>No Active Subscriptions</h3>
                <p>Choose a plan to manage your home maintenance.</p>
                <br>
                <button class="btn btn-primary" onclick="renderView('plans')">
                    Explore Plans
                </button>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="content-card">
            <h3>My Subscriptions</h3>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Plan</th>
                            <th>Price</th>
                            <th>Duration</th>
                            <th>Purchase Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subscriptions.map(item => `
                            <tr>
                                <td>${escapeHTML(item.plan)}</td>
                                <td>${formatPrice(item.price)}</td>
                                <td>${escapeHTML(item.duration)}</td>
                                <td>${escapeHTML(item.purchaseDate)}</td>
                                <td>
                                    <span class="status active">
                                        ${escapeHTML(item.status)}
                                    </span>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


/* ==========================================
   PAYMENT HISTORY
========================================== */

function renderPayments() {
    const content = document.getElementById("dashboardContent");
    const data = getData();

    let payments;

    if (currentUser.role === "admin") {
        payments = data.payments;
    } else {
        payments = data.payments.filter(
            item => item.customerId === currentUser.id
        );
    }

    if (!payments.length) {
        content.innerHTML = `
            <div class="content-card empty-state">
                <div class="empty-icon">💳</div>
                <h3>No Payment Records</h3>
                <p>Your demo payment history will appear here.</p>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="content-card">
            <h3>Payment History</h3>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${currentUser.role === "admin" ? "<th>Customer ID</th>" : ""}
                            <th>Plan</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(payment => `
                            <tr>
                                ${currentUser.role === "admin"
                                    ? `<td>${escapeHTML(payment.customerId)}</td>`
                                    : ""}
                                <td>${escapeHTML(payment.plan)}</td>
                                <td>${formatPrice(payment.amount)}</td>
                                <td>${escapeHTML(payment.method)}</td>
                                <td>${escapeHTML(payment.date)}</td>
                                <td><span class="status success">Success</span></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
            <p class="demo-note">All transactions are simulated. No real payment is processed.</p>
        </div>
    `;
}


/* 
   FEEDBACK
*/

function renderFeedback() {
    const content = document.getElementById("dashboardContent");
    const data = getData();

    const completed = getUserBookings().filter(
        booking => booking.status === "Completed"
    );

    content.innerHTML = `
        <div class="content-card">
            <h3>Share Your Feedback</h3>

            ${completed.length ? `
                <form class="dashboard-form" id="feedbackForm">

                    <div class="form-group">
                        <label for="feedbackBooking">Completed Booking</label>
                        <select id="feedbackBooking" required>
                            ${completed.map(booking => `
                                <option value="${booking.id}">
                                    ${escapeHTML(booking.service)} - ${escapeHTML(booking.date)}
                                </option>
                            `).join("")}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="feedbackRating">Rating</label>
                        <select id="feedbackRating" required>
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Very Good</option>
                            <option value="3">3 - Good</option>
                            <option value="2">2 - Average</option>
                            <option value="1">1 - Poor</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="feedbackComment">Your Review</label>
                        <textarea id="feedbackComment"
                            placeholder="Write your feedback..." required></textarea>
                    </div>

                    <button class="btn btn-primary" type="submit">
                        Submit Feedback
                    </button>
                </form>
            ` : `
                <p>Feedback can be submitted after a booking is completed.</p>
            `}
        </div>

        <div class="content-card">
            <h3>Your Submitted Feedback</h3>
            ${data.feedback.filter(item => item.customerId === currentUser.id).map(item => `
                <p>⭐ ${item.rating}/5 — ${escapeHTML(item.comment)}</p>
            `).join("") || "<p>No feedback submitted yet.</p>"}
        </div>
    `;

    const form = document.getElementById("feedbackForm");

    if (form) {
        form.addEventListener("submit", submitFeedback);
    }
}

function submitFeedback(event) {
    event.preventDefault();

    const data = getData();

    data.feedback.push({
        id: makeId(),
        customerId: currentUser.id,
        bookingId: Number(document.getElementById("feedbackBooking").value),
        rating: Number(document.getElementById("feedbackRating").value),
        comment: document.getElementById("feedbackComment").value.trim(),
        date: getDate()
    });

    saveData(data);

    showToast("Thank you for your feedback!");
    renderView("feedback");
}


/*
   PROFESSIONAL JOBS
 */

function renderJobs() {
    const content = document.getElementById("dashboardContent");
    const data = getData();

    const jobs = data.bookings.filter(
        item => item.status === "Pending" ||
            item.professionalId === currentUser.id
    );

    if (!jobs.length) {
        content.innerHTML = `
            <div class="content-card empty-state">
                <div class="empty-icon">🛠️</div>
                <h3>No Available Jobs</h3>
                <p>New service requests will appear here.</p>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="content-card">
            <h3>Service Requests</h3>
            ${jobs.map(job => `
                <div class="content-card">
                    <div class="content-heading">
                        <h3>${escapeHTML(job.service)}</h3>
                        <span class="status ${getStatusClass(job.status)}">
                            ${escapeHTML(job.status)}
                        </span>
                    </div>

                    <p><strong>Customer:</strong> ${escapeHTML(job.customerName)}</p>
                    <p><strong>Date:</strong> ${escapeHTML(job.date)}</p>
                    <p><strong>Time:</strong> ${escapeHTML(job.time)}</p>
                    <p><strong>Address:</strong> ${escapeHTML(job.address)}</p>
                    <br>

                    ${job.status === "Pending" ? `
                        <button class="btn-small"
                            onclick="updateJob(${job.id}, 'Accepted')">
                            Accept Job
                        </button>
                    ` : ""}

                    ${job.status === "Accepted" &&
                        job.professionalId === currentUser.id ? `
                        <button class="btn-small"
                            onclick="updateJob(${job.id}, 'Completed')">
                            Mark Completed
                        </button>
                    ` : ""}
                </div>
            `).join("")}
        </div>
    `;
}

function updateJob(id, status) {
    const data = getData();

    const job = data.bookings.find(item => item.id === Number(id));

    if (!job) return;

    if (status === "Accepted") {
        if (job.status !== "Pending") {
            showToast("This job is no longer available.");
            return;
        }

        job.professionalId = currentUser.id;
    } else if (job.professionalId !== currentUser.id) {
        showToast("You cannot update this job.");
        return;
    }

    job.status = status;

    saveData(data);

    // Try updating the Express demo API.
    apiRequest(`/professional/jobs/${id}`, {
        method: "PATCH",
        headers: {
            "x-demo-user-id": String(currentUser.id)
        },
        body: JSON.stringify({ status })
    }).catch(error => {
        console.warn("Demo job API:", error.message);
    });

    showToast("Job status updated!");
    renderView("jobs");
}


/* 
   PROFESSIONAL EARNINGS
 */

function renderEarnings() {
    const content = document.getElementById("dashboardContent");
    const data = getData();

    const completed = data.bookings.filter(
        item => item.professionalId === currentUser.id &&
            item.status === "Completed"
    );

    // Demonstration earning: ₹300 for each completed job.
    const earnings = completed.length * 300;

    content.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <p>Completed Jobs</p>
                <h3>${completed.length}</h3>
            </div>
            <div class="stat-card">
                <p>Demo Earnings</p>
                <h3>${formatPrice(earnings)}</h3>
            </div>
            <div class="stat-card">
                <p>Per Completed Job</p>
                <h3>₹300</h3>
            </div>
        </div>

        <div class="content-card">
            <h3>Professional Earnings</h3>
            <p>This is a sample earnings calculation for project demonstration.</p>
        </div>
    `;
}


/* 
   ADMIN - PROFESSIONAL MANAGEMENT
 */

function renderProfessionals() {
    const content = document.getElementById("dashboardContent");
    const data = getData();

    const allProfessionals = [
        ...demoAccounts.filter(user => user.role === "professional"),
        ...data.professionals
    ];

    content.innerHTML = `
        <div class="content-card">
            <h3>Professional Accounts</h3>

            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allProfessionals.map(person => `
                            <tr>
                                <td>${escapeHTML(person.name)}</td>
                                <td>${escapeHTML(person.email)}</td>
                                <td>${escapeHTML(person.category || "General")}</td>
                                <td>
                                    <span class="status ${person.approved ? "approved" : "pending"}">
                                        ${person.approved ? "Approved" : "Pending"}
                                    </span>
                                </td>
                                <td>
                                    ${person.id === 2 ? "Demo Account" : `
                                        ${person.approved ? `
                                            <button class="btn-small btn-danger"
                                                onclick="approveProfessional(${person.id}, false)">
                                                Reject
                                            </button>
                                        ` : `
                                            <button class="btn-small"
                                                onclick="approveProfessional(${person.id}, true)">
                                                Approve
                                            </button>
                                        `}
                                    `}
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function approveProfessional(id, approved) {
    const data = getData();

    const professional = data.professionals.find(
        item => item.id === Number(id)
    );

    if (!professional) return;

    professional.approved = approved;

    const user = data.users.find(item => item.id === Number(id));

    if (user) {
        user.approved = approved;
    }

    saveData(data);

    showToast(approved ? "Professional approved!" : "Professional rejected.");
    renderView("professionals");
}


/*
   ADMIN - BOOKINGS
 */

function renderAdminBookings() {
    const content = document.getElementById("dashboardContent");
    const data = getData();

    if (!data.bookings.length) {
        content.innerHTML = `
            <div class="content-card empty-state">
                <h3>No Bookings Found</h3>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="content-card">
            <h3>All Customer Bookings</h3>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.bookings.map(item => `
                            <tr>
                                <td>${escapeHTML(item.customerName)}</td>
                                <td>${escapeHTML(item.service)}</td>
                                <td>${escapeHTML(item.date)}</td>
                                <td>
                                    <span class="status ${getStatusClass(item.status)}">
                                        ${escapeHTML(item.status)}
                                    </span>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


/* 
   ADMIN - PLAN MANAGEMENT
 */

function renderAdminPlans() {
    const content = document.getElementById("dashboardContent");

    content.innerHTML = `
        <div class="content-card">
            <h3>Subscription Plan Management</h3>

            ${plans.map(plan => `
                <form class="content-card admin-plan-form"
                    data-plan-id="${plan.id}">

                    <h3>${escapeHTML(plan.name)}</h3>

                    <div class="form-group">
                        <label>Plan Price (₹)</label>
                        <input type="number" min="1" name="price"
                            value="${Number(plan.price)}" required>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        Update Demo Price
                    </button>
                </form>
            `).join("")}
        </div>
    `;

    document.querySelectorAll(".admin-plan-form").forEach(form => {
        form.addEventListener("submit", event => {
            event.preventDefault();

            const id = Number(form.dataset.planId);
            const price = Number(form.elements.price.value);

            if (!Number.isFinite(price) || price <= 0) {
                showToast("Enter a valid plan price.");
                return;
            }

            plans = plans.map(plan =>
                plan.id === id ? { ...plan, price } : plan
            );

            showToast("Demo plan price updated.");
            renderView("plans");
        });
    });
}


/* 
   MOBILE MENU
*/

document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
});


/* 
   MODAL CLOSE
 */

document.getElementById("authModal").addEventListener("click", event => {
    if (event.target.id === "authModal") {
        closeAuth();
    }
});


/*
   APPLICATION START*/

async function initializeApp() {
    await loadPublicData();
    restoreSession();
}

initializeApp();
