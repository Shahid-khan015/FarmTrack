#!/usr/bin/env python3
"""
Combined FastAPI + Vite Development Server
Serves FastAPI API and proxies frontend requests to Vite dev server
"""
import os
import sys
import asyncio
import httpx
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, FileResponse, HTMLResponse
from starlette.background import BackgroundTask

from main import app as api_app

VITE_DEV_SERVER = "http://localhost:5173"
IS_PRODUCTION = os.environ.get("NODE_ENV") == "production"

combined_app = FastAPI(title="Fleet Management")

combined_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

combined_app.mount("/api", api_app)

client_build_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist", "public")

async def proxy_to_vite(request: Request, path: str = ""):
    """Proxy requests to Vite dev server"""
    async with httpx.AsyncClient() as client:
        url = f"{VITE_DEV_SERVER}/{path}"
        
        headers = dict(request.headers)
        headers.pop("host", None)
        
        try:
            if request.method == "GET":
                response = await client.get(url, headers=headers, follow_redirects=True)
            elif request.method == "POST":
                body = await request.body()
                response = await client.post(url, headers=headers, content=body, follow_redirects=True)
            else:
                response = await client.request(
                    request.method, url, headers=headers, 
                    content=await request.body(), follow_redirects=True
                )
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )
        except httpx.RequestError:
            return HTMLResponse(
                content="<html><body><h1>Vite dev server not running</h1><p>Start Vite with: npx vite --port 5173</p></body></html>",
                status_code=503
            )

if IS_PRODUCTION:
    if os.path.exists(client_build_path):
        @combined_app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            if full_path.startswith("assets/"):
                file_path = os.path.join(client_build_path, full_path)
                if os.path.exists(file_path):
                    return FileResponse(file_path)
            
            index_path = os.path.join(client_build_path, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return HTMLResponse("<html><body><h1>Frontend not built</h1><p>Run: npm run build</p></body></html>", status_code=404)
else:
    @combined_app.get("/{full_path:path}")
    async def proxy_frontend(request: Request, full_path: str = ""):
        return await proxy_to_vite(request, full_path)
    
    @combined_app.api_route("/@vite/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    async def proxy_vite_internal(request: Request, path: str):
        return await proxy_to_vite(request, f"@vite/{path}")


def log(message: str, source: str = "fastapi"):
    formatted_time = datetime.now().strftime("%-I:%M:%S %p")
    print(f"{formatted_time} [{source}] {message}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    log(f"serving on port {port}")
    
    if not IS_PRODUCTION:
        log("Development mode - frontend proxied to Vite dev server")
        log("Start Vite separately with: npx vite --host 0.0.0.0 --port 5173")
    
    uvicorn.run(combined_app, host="0.0.0.0", port=port, log_level="warning")
