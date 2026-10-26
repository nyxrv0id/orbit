"""Orbit FastAPI application entrypoint."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import get_settings
from app.services.github import github_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("orbit")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager for startup and shutdown routines."""
    settings = get_settings()
    logger.info(f"Starting Orbit Backend (Port: {settings.orbit_port}, Host: {settings.orbit_host})")
    yield
    logger.info("Shutting down Orbit Backend, closing connections...")
    await github_service.close()


def create_app() -> FastAPI:
    """Factory creating and configuring the FastAPI instance."""
    settings = get_settings()

    app = FastAPI(
        title="Orbit OSINT API",
        version="0.1.0",
        description="Open-Source Intelligence and Discovery API for Public GitHub Repositories",
        lifespan=lifespan,
    )

    # CORS configuration
    has_wildcard = "*" in settings.cors_origins_list
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_origin_regex=r"https://.*\.onrender\.com",
        allow_credentials=not has_wildcard,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "status_code": exc.status_code,
                "message": exc.detail,
                "path": request.url.path,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled exception processing {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "status_code": 500,
                "message": "An internal server error occurred.",
                "path": request.url.path,
            },
        )

    # Register routers
    app.include_router(router)

    return app


app = create_app()
