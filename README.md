
# HomeEase - Subscription-Based Home Care Platform

HomeEase is a responsive home maintenance and subscription management platform developed as a frontend development internship project.

## Project Overview

HomeEase helps users explore home maintenance services, choose subscription plans, book services and manage their demo transactions.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- REST APIs
- Browser Local Storage
- Vercel

## Main Features

### Customer
- Registration and login
- Browse home maintenance services
- View subscription plans
- Purchase subscriptions using simulated payments
- Book home maintenance services
- View booking history
- View subscription history
- View payment history
- Submit feedback

### Professional
- Professional demo account
- View available service requests
- Accept service requests
- Update job status
- View sample earnings

### Admin
- Admin demo account
- View dashboard statistics
- Manage demo professionals
- Approve or reject registered professionals
- View customer bookings
- Manage subscription plan prices
- View demo payment records

## Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Customer | customer@homeease.demo | Demo@123 |
| Professional | professional@homeease.demo | Demo@123 |
| Admin | admin@homeease.demo | Demo@123 |

## Installation and Setup

1. Download or clone the project.
2. Open the HomeEase folder in Visual Studio Code.
3. Open the terminal.
4. Install dependencies:

   npm install

5. Start the application:

   npm start

6. Open the website:

   http://localhost:5000

## API Endpoints

### General
- GET /api
- GET /api/health
- GET /api/services
- GET /api/plans

### Authentication
- POST /api/register
- POST /api/login

### Customer
- POST /api/bookings
- GET /api/bookings
- POST /api/subscriptions/purchase
- GET /api/subscriptions
- GET /api/payments

### Professional
- GET /api/professional/jobs
- PATCH /api/professional/jobs/:id

### Admin
- GET /api/admin/summary
- GET /api/admin/professionals
- PATCH /api/admin/professionals/:id
- GET /api/admin/bookings
- GET /api/admin/payments

## Data and Payment Disclaimer

This project uses dummy information and simulated payment transactions for demonstration purposes.

Browser-side demo accounts, bookings, subscriptions, payments and feedback are stored using localStorage.

The Express backend uses temporary in-memory sample data. Backend changes may reset when the server restarts or a serverless function is recreated.

No real payments are processed and no real customer financial information is required.

## Future Enhancements

- Database integration
- Secure authentication
- Real-time booking updates
- Professional document verification
- Real payment gateway integration
- Email notifications
- Advanced admin analytics

## Project Purpose

Developed for the Unified Mentor Frontend Development Internship.
