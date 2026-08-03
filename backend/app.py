import time
import os
import psutil
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import config after loading dotenv
import config
from routes.analyze_routes import router as analyze_router

VERSION = '2.0.0'
START_TIME = time.time()

# Initialize counter
class ScanCounter:
    def __init__(self):
        self._count = 0

    def increment(self):
        self._count += 1

    def get(self):
        return self._count

scan_counter = ScanCounter()

# Initialize FastAPI App
app = FastAPI(
    title="Social Engineering Defense API",
    version=VERSION,
    docs_url="/docs" if config.NODE_ENV == "development" else None,
    redoc_url=None
)

# Store scan counter in app state so routes can access it
app.state.scan_counter = scan_counter

# ── GZip Compression Middleware ──────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── CORS Middleware ──────────────────────────────────────────────────────────
# Supports chrome-extension://* and localhost via regex matching
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):3000|chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ── Global Rate Limiter Middleware (replicates express-rate-limit) ───────────
class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, window_ms: int = 15 * 60 * 1000, max_requests: int = 100):
        super().__init__(app)
        self.window_seconds = window_ms / 1000.0
        self.max_requests = max_requests
        self.ip_records = {}  # IP -> list of timestamps

    async def dispatch(self, request: Request, call_next):
        # Apply rate limiting only to API paths
        if request.url.path.startswith("/api"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()

            # Clean up records older than window
            cutoff = now - self.window_seconds
            timestamps = self.ip_records.get(client_ip, [])
            timestamps = [t for t in timestamps if t > cutoff]
            self.ip_records[client_ip] = timestamps

            if len(timestamps) >= self.max_requests:
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "error": "Too many requests. Please try again in 15 minutes."
                    }
                )
            
            self.ip_records[client_ip].append(now)

        return await call_next(request)

app.add_middleware(RateLimiterMiddleware, window_ms=15 * 60 * 1000, max_requests=100)

# ── Helper for Uptime ────────────────────────────────────────────────────────
def get_uptime() -> int:
    return round(time.time() - START_TIME)

# ── Health Check Endpoint ────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    
    return {
        "status": "ok",
        "version": VERSION,
        "uptime": get_uptime(),
        "memory": {
            "heapUsed": f"{round(mem_info.rss / 1024 / 1024)} MB",
            "heapTotal": f"{round(mem_info.vms / 1024 / 1024)} MB",
            "rss": f"{round(mem_info.rss / 1024 / 1024)} MB"
        },
        "totalScans": scan_counter.get()
    }

# ── Stats Endpoint ───────────────────────────────────────────────────────────
@app.get("/api/stats")
async def stats():
    return {
        "success": True,
        "version": VERSION,
        "totalScans": scan_counter.get(),
        "uptime": get_uptime(),
        "environment": config.NODE_ENV
    }

# ── Include Routes ───────────────────────────────────────────────────────────
# Replicates Express: app.use('/api', analyzeRoutes)
app.include_router(analyze_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    print(f"\n🛡️  SE Defense API v{VERSION} running on http://localhost:{config.PORT}")
    print(f"   Environment: {config.NODE_ENV}")
    print(f"   Health:  http://localhost:{config.PORT}/health")
    print(f"   Stats:   http://localhost:{config.PORT}/api/stats\n")
    uvicorn.run("app:app", host="0.0.0.0", port=config.PORT, log_level="info")
