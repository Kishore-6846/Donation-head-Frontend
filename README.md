# Donation Head & Receipt - Frontend

Modern, high-performance React (Vite) Single Page Application for NGO Donation Receipt Management, featuring SuperAdmin and Trust Admin portals with 80G compliant receipts and automated categorization.

## 🚀 Features

- **Dual Portals**: Dedicated **SuperAdmin** and **Trust Admin** dashboards.
- **Donation Heads Management**: Global categories created by SuperAdmin, customized trust-scoped categories with auto-formatting `(Trust Name)`, and scoped deletion.
- **80G & 10BD Compliant Receipts**: Generate, view, search, export, and print donation receipts.
- **Profile & Account Controls**: Clean desktop dropdowns, receipts prefix settings, 80G Vault, and security controls.
- **Responsive & Modern Design**: Built with Lucide icons, styled with curated modern design tokens.

## 🛠️ Technology Stack

- **React 18**
- **Vite**
- **React Router DOM v6**
- **Lucide React** (Icons)

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The app will start at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
The production bundle will be generated in the `dist/` directory.

## 🔗 Backend Connectivity
The frontend expects the backend server running at `http://localhost:5000`. API requests to `/api/*` are routed through the Vite dev proxy configured in `vite.config.js`.
