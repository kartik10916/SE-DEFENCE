from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from controllers import analyze_controller

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Text content to analyze for social engineering threats")

@router.post("/analyze")
async def analyze(payload: AnalyzeRequest, request: Request):
    try:
        # Retrieve scan counter from app state
        scan_counter = request.app.state.scan_counter
        
        result = analyze_controller.analyze_text(
            payload.text,
            scan_counter_inc_callback=scan_counter.increment if scan_counter else None
        )
        
        # Build response with headers
        headers = {
            "X-Request-Id": result["requestId"],
            "X-Analysis-Time-Ms": str(result["elapsedMs"])
        }
        
        return JSONResponse(
            status_code=200,
            headers=headers,
            content={
                "success": True,
                "report": result["report"]
            }
        )
    except ValueError as e:
        # Replicate Node.js 400 validation error
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": str(e),
                "requestId": analyze_controller.generate_request_id()
            }
        )
    except Exception as e:
        # Replicate general error response
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "message": str(e)
                }
            }
        )

@router.get("/history")
async def get_history():
    history = analyze_controller.get_history_list()
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "count": len(history),
            "history": history
        }
    )
