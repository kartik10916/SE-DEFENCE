# 🧩 SE Defense Chrome Extension (Manifest V3)

A Chrome browser extension that scans active web pages, emails (like Gmail), and text inputs in real-time. It sends content to the **Social Engineering Defense API** to warn users about phishing or social engineering threats.

---

## 🛠️ Components

- **`manifest.json`**: Defines permissions, host access rules, and background script configurations for Manifest V3 compatibility.
- **`background.js`**: Background service worker that listens to extension messages and manages requests to the local backend.
- **`content.js`**: Scans DOM nodes of active web pages (such as Gmail bodies) to extract and review text contents.
- **`popup.html` / `popup.js` / `popup.css`**: The extension panel UI shown when clicking the icon. It allows manual text analysis and displays local scanning flags.

---

## 🚀 Installation Guide

To load the extension into your Chrome browser locally:

1. Open Google Chrome.
2. Navigate to **`chrome://extensions/`** in your URL bar.
3. Enable **Developer Mode** by toggling the switch in the top-right corner.
4. Click the **Load Unpacked** button in the top-left.
5. Browse and select the **`extension/`** folder of this repository.

---

## ⚙️ Backend Integration

By default, the browser extension communicates with the local backend running at:
`http://localhost:5000/api`

Ensure the Python FastAPI backend is started (`python backend/app.py`) for the extension scanning functions to operate correctly.
