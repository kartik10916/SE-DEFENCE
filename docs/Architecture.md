# SE Defense Assistant — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   User Interfaces                        │
│                                                          │
│   ┌───────────────────┐   ┌────────────────────────┐    │
│   │   React Web App   │   │  Chrome Extension      │    │
│   │   (port 3000)     │   │  (popup + content.js)  │    │
│   └────────┬──────────┘   └──────────┬─────────────┘    │
│            │                          │                   │
└────────────┼──────────────────────────┼───────────────────┘
             │   HTTP REST              │   HTTP REST
             ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js / Express Backend (port 5000)       │
│                                                          │
│  POST /api/analyze ──► ┌─────────────────────────────┐  │
│                        │    Analysis Pipeline         │  │
│                        │  ┌──────────────────────┐   │  │
│                        │  │  1. Keyword Detector  │   │  │
│                        │  │  2. URL Detector      │   │  │
│                        │  │  3. Sentiment Detector│   │  │
│                        │  │  4. Risk Calculator   │   │  │
│                        │  │  5. Explanation Engine│   │  │
│                        │  └──────────────────────┘   │  │
│                        └─────────────────────────────┘  │
│  GET  /api/history  ──► In-memory store (last 50)        │
└─────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                           │
│   suspiciousKeywords.json  │  authorityWords.json        │
│   urgencyWords.json        │  sensitiveWords.json        │
└─────────────────────────────────────────────────────────┘
```

## Detection Pipeline

```
Input Text
    │
    ├──► KeywordDetector      → keyword score (0-100)
    │    ├── suspiciousKeywords.json (35%)
    │    ├── urgencyWords.json       (weighted)
    │    ├── authorityWords.json     (weighted)
    │    └── sensitiveWords.json     (15%)
    │
    ├──► URLDetector          → url score (0-100)
    │    ├── IP-based URLs
    │    ├── URL shorteners
    │    ├── Suspicious TLDs
    │    ├── Brand impersonation
    │    └── HTTP (non-HTTPS)
    │
    ├──► SentimentDetector    → tone score (0-100)
    │    ├── Fear word lists
    │    ├── Urgency phrase lists
    │    ├── Coercion phrases
    │    └── sentiment npm library
    │
    └──► RiskCalculator       → composite score
         ├── Weighted sum (keyword×0.35 + url×0.30 + sentiment×0.20 + sensitive×0.15)
         └── Attack type classification
              │
              └──► ExplanationEngine → human-readable report
```

## Risk Levels

| Score | Level    | Color   |
|-------|----------|---------|
| 0–30  | Low      | 🟢 Green |
| 31–59 | Medium   | 🟡 Amber |
| 60–79 | High     | 🟠 Orange |
| 80–100| Critical | 🔴 Red  |
