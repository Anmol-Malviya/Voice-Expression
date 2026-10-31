from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse

def success_response(
    data: Any = None, 
    message: str = "Operation successful", 
    status_code: int = 200,
    extra_fields: Optional[Dict[str, Any]] = None,
) -> JSONResponse:
    """Standard success API response envelope."""
    content: Dict[str, Any] = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    if extra_fields:
        content.update(extra_fields)
    return JSONResponse(status_code=status_code, content=content)

def error_response(
    message: str = "An error occurred", 
    detail: Any = None, 
    status_code: int = 400
) -> JSONResponse:
    """Standard error API response envelope."""
    content = {
        "success": False,
        "message": message,
        "detail": detail if detail is not None else {},
    }
    return JSONResponse(status_code=status_code, content=content)

