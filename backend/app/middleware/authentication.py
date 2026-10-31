import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from backend.app.core.security import decode_access_token

logger = logging.getLogger("voice_expression.auth_middleware")

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Inspects Authorization header and binds user token payload to request.state.user."""
    async def dispatch(self, request: Request, call_next) -> Response:
        auth_header = request.headers.get("Authorization")
        request.state.user = None
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            payload = decode_access_token(token)
            if payload:
                request.state.user = payload

        response = await call_next(request)
        return response

