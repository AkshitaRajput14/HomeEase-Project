
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// ---------------- DUMMY DATA ----------------

const services = [
  { id: 1, name: "Home Cleaning", category: "Cleaning", price: 499, icon: "🧹", description: "Professional home cleaning services." },
  { id: 2, name: "Plumbing", category: "Repair", price: 399, icon: "🔧", description: "Tap, pipe and bathroom repairs." },
  { id: 3, name: "Electrical Repair", category: "Repair", price: 499, icon: "💡", description: "Electrical maintenance and repairs." },
  { id: 4, name: "AC Servicing", category: "Maintenance", price: 799, icon: "❄️", description: "AC cleaning and servicing." },
  { id: 5, name: "Appliance Repair", category: "Repair", price: 599, icon: "🛠️", description: "Home appliance maintenance." },
  { id: 6, name: "General Maintenance", category: "Maintenance", price: 499, icon: "🏠", description: "General home maintenance." }
];

const plans = [
  { id: 1, name: "Basic", price: 699, duration: "Monthly", features: ["2 service visits", "Basic maintenance", "Email support"] },
  { id: 2, name: "Standard", price: 1499, duration: "Monthly", features: ["5 service visits", "Priority booking", "Discounted repairs"] },
  { id: 3, name: "Premium", price: 11999, duration: "Yearly", features: ["Unlimited scheduled inspections", "Priority support", "Special discounts"] }
];

// Demo users
const users = [
  {
    id: 1,
    name: "Demo Admin",
    email: "admin@homeease.demo",
    password: "Demo@123",
    role: "admin"
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
    role: "customer"
  }
];

let bookings = [
  {
    id: 1,
    customerId: 3,
    customerName: "Demo Customer",
    service: "Home Cleaning",
    date: "2026-11-15",
    time: "10:00 AM",
    address: "Demo Address, India",
    status: "Pending"
  }
];

let payments = [
  {
    id: 1,
    customerId: 3,
    plan: "Basic",
    amount: 699,
    method: "Demo UPI",
    status: "Success",
    date: "2026-11-09"
  }
];

let subscriptions = [];

let professionals = [
  {
    id: 2,
    name: "Demo Professional",
    email: "professional@homeease.demo",
    category: "Cleaning",
    approved: true
  }
];

let nextUserId = 4;
let nextBookingId = 2;
let nextPaymentId = 2;
let nextSubscriptionId = 1;

// ---------------- HELPER FUNCTIONS ----------------

function getUser(req) {
  const userId = Number(req.headers["x-demo-user-id"]);
  return users.find(user => user.id === userId);
}

function requireRole(role) {
  return (req, res, next) => {
    const user = getUser(req);

    if (!user || user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Please login with the correct demo account."
      });
    }

    req.user = user;
    next();
  };
}

// ---------------- GENERAL APIs ----------------

// API welcome
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to HomeEase API"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HomeEase backend is running"
  });
});

// Get services
app.get("/api/services", (req, res) => {
  res.json({ success: true, services });
});

// Get subscription plans
app.get("/api/plans", (req, res) => {
  res.json({ success: true, plans });
});

// ---------------- AUTHENTICATION APIs ----------------

// Register
app.post("/api/register", (req, res) => {
  const { name, email, phone, password, role, category } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Please fill all required fields."
    });
  }

  if (!["customer", "professional"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid account role."
    });
  }

  const existingUser = users.find(
    user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "This email is already registered."
    });
  }

  const newUser = {
    id: nextUserId++,
    name,
    email,
    phone: phone || "",
    password,
    role,
    approved: role === "customer",
    category: category || ""
  };

  users.push(newUser);

  if (role === "professional") {
    professionals.push({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      category: newUser.category,
      approved: false
    });
  }

  res.status(201).json({
    success: true,
    message: role === "professional"
      ? "Registration successful. Waiting for admin approval."
      : "Registration successful.",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      approved: newUser.approved
    }
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    item =>
      item.email.toLowerCase() === String(email || "").toLowerCase() &&
      item.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password."
    });
  }

  if (user.role === "professional" && !user.approved) {
    return res.status(403).json({
      success: false,
      message: "Your professional account is waiting for admin approval."
    });
  }

  res.json({
    success: true,
    message: "Login successful.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// ---------------- CUSTOMER APIs ----------------

// Create booking
app.post("/api/bookings", requireRole("customer"), (req, res) => {
  const { service, date, time, address } = req.body;

  if (!service || !date || !time || !address) {
    return res.status(400).json({
      success: false,
      message: "Please provide all booking details."
    });
  }

  const booking = {
    id: nextBookingId++,
    customerId: req.user.id,
    customerName: req.user.name,
    service,
    date,
    time,
    address,
    status: "Pending"
  };

  bookings.push(booking);

  res.status(201).json({
    success: true,
    message: "Service booked successfully.",
    booking
  });
});

// Customer booking history
app.get("/api/bookings", requireRole("customer"), (req, res) => {
  const customerBookings = bookings.filter(
    booking => booking.customerId === req.user.id
  );

  res.json({
    success: true,
    bookings: customerBookings
  });
});

// Purchase subscription (demo payment)
app.post("/api/subscriptions/purchase", requireRole("customer"), (req, res) => {
  const { planId, method } = req.body;

  const plan = plans.find(item => item.id === Number(planId));

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Subscription plan not found."
    });
  }

  const payment = {
    id: nextPaymentId++,
    customerId: req.user.id,
    plan: plan.name,
    amount: plan.price,
    method: method || "Demo UPI",
    status: "Success",
    date: new Date().toISOString().slice(0, 10)
  };

  payments.push(payment);

  const subscription = {
    id: nextSubscriptionId++,
    customerId: req.user.id,
    plan: plan.name,
    price: plan.price,
    duration: plan.duration,
    status: "Active",
    purchaseDate: payment.date
  };

  subscriptions.push(subscription);

  res.status(201).json({
    success: true,
    message: "Demo payment successful. Subscription activated.",
    payment,
    subscription
  });
});

// Customer subscriptions
app.get("/api/subscriptions", requireRole("customer"), (req, res) => {
  const customerSubscriptions = subscriptions.filter(
    item => item.customerId === req.user.id
  );

  res.json({
    success: true,
    subscriptions: customerSubscriptions
  });
});

// Customer payment history
app.get("/api/payments", requireRole("customer"), (req, res) => {
  const customerPayments = payments.filter(
    item => item.customerId === req.user.id
  );

  res.json({
    success: true,
    payments: customerPayments
  });
});

// ---------------- PROFESSIONAL APIs ----------------

// Available jobs
app.get("/api/professional/jobs", requireRole("professional"), (req, res) => {
  const jobs = bookings.filter(
    booking => booking.status === "Pending" ||
      booking.professionalId === req.user.id
  );

  res.json({ success: true, jobs });
});

// Update job status
app.patch("/api/professional/jobs/:id", requireRole("professional"), (req, res) => {
  const { status } = req.body;

  if (!["Accepted", "Completed"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job status."
    });
  }

  const booking = bookings.find(
    item => item.id === Number(req.params.id)
  );

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found."
    });
  }

  if (status === "Accepted") {
    if (booking.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This booking is no longer available."
      });
    }

    booking.professionalId = req.user.id;
  } else if (booking.professionalId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "You cannot update this job."
    });
  }

  booking.status = status;

  res.json({
    success: true,
    message: "Job status updated.",
    booking
  });
});

// ---------------- ADMIN APIs ----------------

// Admin dashboard summary
app.get("/api/admin/summary", requireRole("admin"), (req, res) => {
  res.json({
    success: true,
    summary: {
      totalUsers: users.length,
      totalCustomers: users.filter(user => user.role === "customer").length,
      totalProfessionals: professionals.length,
      totalBookings: bookings.length,
      totalPayments: payments.length,
      totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0)
    }
  });
});

// View professionals
app.get("/api/admin/professionals", requireRole("admin"), (req, res) => {
  res.json({ success: true, professionals });
});

// Approve or reject professional
app.patch("/api/admin/professionals/:id", requireRole("admin"), (req, res) => {
  const professional = professionals.find(
    item => item.id === Number(req.params.id)
  );

  if (!professional) {
    return res.status(404).json({
      success: false,
      message: "Professional not found."
    });
  }

  const { approved } = req.body;

  if (typeof approved !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Please provide an approval value."
    });
  }

  professional.approved = approved;

  const user = users.find(item => item.id === professional.id);
  if (user) user.approved = approved;

  res.json({
    success: true,
    message: approved ? "Professional approved." : "Professional rejected.",
    professional
  });
});

// View all bookings
app.get("/api/admin/bookings", requireRole("admin"), (req, res) => {
  res.json({ success: true, bookings });
});

// View all payments
app.get("/api/admin/payments", requireRole("admin"), (req, res) => {
  res.json({ success: true, payments });
});

// ---------------- SERVER ----------------

// Serve homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`HomeEase server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
