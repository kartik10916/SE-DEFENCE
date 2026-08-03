# 💻 SE Defense Frontend (React Web App)

This is the web user interface for the **Social Engineering Defense Assistant**, built using **React**, **Chart.js**, and custom styled CSS. It connects to the FastAPI backend to visualize threat reports, chart statistics, and display text highlights.

---

## 🎨 Features

- **Dashboard Visualizations**: Interactive doughnut charts for risk distribution and bar charts for attack type frequencies.
- **Dynamic Text Highlight**: Visually highlights suspicious, urgent, authoritative, and sensitive phrases inside the input container.
- **Comprehensive Reports**: Detailed breakdown of threat indicators, sentiment tone analysis, and action advice.
- **Report Exporting**: Exporters for analysis reports (JSON/PDF).
- **Toast Notifications**: System messages and error feedback toasts.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```

### Running the Application
Start the development server:
```bash
npm start
```
The React development server runs on **`http://localhost:3000`** and proxies API calls to the backend on `http://localhost:5000` automatically.

---

## ⚙️ Configuration

If you deploy the API to a different host, you can set the API endpoint URL using environment variables:
Create a `.env` file in the `frontend` folder:
```env
REACT_APP_API_URL=http://your-production-backend-ip/api
```
