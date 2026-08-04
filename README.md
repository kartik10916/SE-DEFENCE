# 🛡️ Social Engineering Defense Assistant

A full-stack AI-powered tool that analyzes text messages, emails, and web content for social engineering threats — phishing, pretexting, urgency manipulation, and more.

---

## 📁 Project Structure

```
Social-Engineering-Defense-Assistant/
├── backend/          → Node.js Express API with detection services
├── frontend/         → React web application
├── extension/        → Chrome browser extension
├── docs/             → Architecture diagrams, screenshots, report
└── future/           → ML model & analytics dashboard (roadmap)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 17
- npm >= 9

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Server runs at `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
App runs at `http://localhost:3000`

### Chrome Extension Setup
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load Unpacked** → select the `extension/` folder

---

## 🔍 Features

| Feature | Description |
|---|---|
| 🎯 Keyword Detection | Detects phishing, urgency, and authority manipulation keywords |
| 🌐 URL Analysis | Identifies suspicious, shortened, or malformed URLs |
| 💬 Sentiment Analysis | Measures fear, urgency, and coercion tone |
| 📊 Risk Scoring | Calculates an overall risk score (0–100) |
| 🔎 Highlighted Text | Visually marks dangerous segments |
| 🧩 Browser Extension | Scans web pages and Gmail in real time |

---

## 🧪 Example Usage

**Input:**
> "URGENT: Your account has been compromised. Click here immediately to verify your credentials: http://secure-login.paypa1.com"

**Output:**
- Risk Score: **92 / 100** 🔴 HIGH
- Attack Type: **Phishing + Urgency Manipulation**
- Flagged Keywords: `urgent`, `compromised`, `verify your credentials`
- Suspicious URL: `http://secure-login.paypa1.com`

---

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, Uvicorn
- **Frontend:** React, Chart.js, Axios
- **Extension:** Chrome Extensions API (Manifest V3)
- **Future:** scikit-learn, TensorFlow (ML model & analytics roadmap)

---

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.
