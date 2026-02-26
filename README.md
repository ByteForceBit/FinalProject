# SmartExpenseTracker

An intelligent expense tracking system that not only captures receipts but actively identifies financial leakages, excessive spending, and uncontrolled expenses to help small businesses maintain profitability.

#Features
Core Functionality

📸 Smart Receipt Scanning - AI-powered OCR extraction using Google Gemini 2.0
🔍 Financial Leakage Detection - Identifies unnecessary, excessive, or high-risk spending
💰 Tax Intelligence - Separate tracking for GST vs Other Taxes
📊 Real-time Dashboard - Live metrics, risk scores, and insights
🚨 Flagged Transactions - Automatic highlighting of high-risk expenses (7-10 score)
💡 AI Recommendations - Actionable insights to reduce costs and improve profitability

Advanced Analytics

Risk Score System (0-10 scale) - Every transaction assessed for leakage potential
Category-based Analysis - Identify which categories have highest leakage
Flag Reasons - Specific explanations for each high-risk transaction
Savings Insights - AI-generated tips to optimize spending


#Architecture


┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │─────▶│  Express API    │─────▶│  Gemini AI      │
│  (Tailwind CSS) │      │  (Node.js)      │      │  (OCR + Risk)   │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────┐
│                                         │
│        Supabase (PostgreSQL)            │
│        - Authentication                 │
│        - Database (expenses table)      │
│        - Real-time subscriptions        │
│                                         │
└─────────────────────────────────────────┘


#Prerequisites

Node.js 18+ and npm
Supabase account
Google Gemini API key




#Usage

1. Sign Up / Login

Create account with email/password
Or use social login (Google, GitHub)

2. Scan Receipt

Click "Scan Receipt" button
Take photo or upload image
AI analyzes and extracts data
Risk score automatically calculated

3. Review Results

Check extracted fields (merchant, amount, date, etc.)
View Leakage Risk Score (0-10)
Read Flag Reason for high-risk items
Get Savings Insight recommendations

4. Dashboard Analytics

Total Expenses YTD - Overall spending
Total GST Claimed - Tax credits available
Risk Score Average - Portfolio health indicator
Top 5 Leakage Categories - Problem areas
Flagged Transactions - High-risk items (≥7 score)
AI Recommendations - Strategic cost-cutting advice


#Tech Stack
Frontend

React 18 - UI framework
Vite - Build tool
Tailwind CSS - Styling
Lucide React - Icons
Supabase JS - Database client

Backend

Node.js 18 - Runtime
Express - Web framework
Supabase - Database & Auth
Google Gemini 2.0 Flash - AI/OCR
Helmet - Security
Rate Limiting - API protection

Database

PostgreSQL (via Supabase)
Real-time subscriptions
Row Level Security (RLS)
