# 🛡️ SE Defense Backend API (Python FastAPI)

This is the Python-based backend API for the **Social Engineering Defense Assistant**, built using **FastAPI** and **Uvicorn**. It performs advanced analysis on text inputs to identify social engineering threats such as phishing, urgency manipulation, authority impersonation, and pretexting.

---

## 📁 Folder Structure

```
backend/
├── controllers/
│   └── analyze_controller.py   → Core integration & analytics history
├── data/
│   ├── authorityWords.json      → Impersonation dictionaries
│   ├── sensitiveWords.json      → Sensitive data keyword lists
│   ├── sentiment_emojis.json    → Emoji sentiment scores
│   ├── sentiment_labels.json    → AFINN-165 vocabulary scores
│   ├── sentiment_negators.json  → Negation lexicons
│   ├── suspiciousKeywords.json  → General phishing keyword list
│   └── urgencyWords.json        → Time-pressure keywords
├── routes/
│   └── analyze_routes.py       → Endpoints definition
├── services/
│   ├── explanation_engine.py    → Narrative builder & custom advice
│   ├── keyword_detector.py      → Lexical boundary scanner
│   ├── risk_calculator.py       → Composite threat & confidence scorer
│   ├── sentiment_detector.py    → Sentiment & coercive tone engine
│   └── url_detector.py          → URL parser & obfuscation scanner
├── utils/
│   ├── constants.py             → Static enums & limits
│   ├── regex.py                 → URL & IP regular expressions
│   └── score_helper.py          → Normalization & rounding math utilities
├── app.py                      → FastAPI application entrypoint
├── requirements.txt            → Python package list
└── test_backend.py             → Local automated smoke test
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- pip (Python package installer)

### Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server
Run the FastAPI development server:
```bash
python app.py
```
The server will start on **`http://localhost:5000`** with the following endpoints active:
- Main API Base: `http://localhost:5000/api`
- Auto-generated Swagger Documentation: `http://localhost:5000/docs` (available in development environment)

---

## 📡 API Endpoints Reference

### 1. Health Check
*   **Method**: `GET`
*   **Path**: `/health`
*   **Description**: Returns server uptime, version, scan statistics, and system memory metrics.

### 2. Stats
*   **Method**: `GET`
*   **Path**: `/api/stats`
*   **Description**: Exposes runtime statistics (total scans completed, uptime, environment).

### 3. Analyze Text
*   **Method**: `POST`
*   **Path**: `/api/analyze`
*   **Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "text": "Your account has been compromised! Click here immediately: http://phishing-site.tk"
    }
    ```
*   **Response (200 OK)**:
    Returns the threat report including composite risk score, risk level, flagged keywords, suspicious URLs, tone indicators, text highlights, and advice.

### 4. Analysis History
*   **Method**: `GET`
*   **Path**: `/api/history`
*   **Description**: Returns the last 100 analysis reports stored in the in-memory cache.

---

## 🧪 Testing

To run the automated local smoke test and verify logic alignment with target scores:
```bash
python test_backend.py
```
