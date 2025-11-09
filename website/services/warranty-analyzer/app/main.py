"""
FastAPI application for warranty contract analysis
"""

import logging
import secrets
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.config import get_settings
from app.document_processor import DocumentProcessor
from app.models import (
    DocumentType,
    ErrorResponse,
    HealthCheckResponse,
    ReanalyzeRequest,
    WarrantyAnalysisResponse,
    WarrantyAnalysisStatus,
)
from app.warranty_analyzer import WarrantyAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Warranty Analyzer Service")
    logger.info(f"Version: {__version__}")
    logger.info(f"Environment: {settings.environment}")

    # Create upload directory
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload directory: {settings.upload_dir}")

    yield

    # Shutdown
    logger.info("Shutting down Warranty Analyzer Service")


# Create FastAPI app
app = FastAPI(
    title="Warranty Analyzer API",
    description="AI-powered warranty contract analysis using Claude AI",
    version=__version__,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors
document_processor = DocumentProcessor()
warranty_analyzer = WarrantyAnalyzer()


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    """Root endpoint"""
    return {
        "service": "Warranty Analyzer API",
        "version": __version__,
        "status": "running",
    }


@app.get("/health", response_model=HealthCheckResponse, tags=["Health"])
async def health_check() -> HealthCheckResponse:
    """Health check endpoint"""
    try:
        # Check services
        services = {
            "api": True,
            "claude_ai": bool(settings.anthropic_api_key),
            "storage": settings.upload_dir.exists(),
        }

        return HealthCheckResponse(
            status="healthy" if all(services.values()) else "degraded",
            version=__version__,
            timestamp=datetime.now(),
            services=services,
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="unhealthy",
            version=__version__,
            timestamp=datetime.now(),
            services={"api": False, "claude_ai": False, "storage": False},
        )


@app.post(
    "/analyze-warranty",
    response_model=WarrantyAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Warranty Analysis"],
)
async def analyze_warranty(
    file: UploadFile = File(..., description="Warranty document (PDF or image)"),
    user_id: str = Form(..., description="User ID"),
    product_id: str | None = Form(None, description="Optional product ID"),
) -> WarrantyAnalysisResponse:
    """
    Analyze a warranty document and extract key information

    - **file**: Warranty document (PDF, PNG, JPEG)
    - **user_id**: ID of the user uploading the warranty
    - **product_id**: Optional ID of the product this warranty belongs to

    Returns structured warranty information including:
    - Warranty duration and coverage
    - Exclusions and limitations
    - Claim procedures and contacts
    - Important dates and deadlines
    - Highlighted critical information
    """
    logger.info(f"Analyzing warranty for user {user_id}")

    try:
        # Validate file type
        if file.content_type not in [e.value for e in DocumentType]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}. "
                f"Supported types: PDF, PNG, JPEG",
            )

        # Validate file size
        file_content = await file.read()
        file_size = len(file_content)

        if file_size > settings.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {settings.max_file_size / 1_048_576:.1f}MB",
            )

        logger.info(f"Processing file: {file.filename} ({file_size} bytes)")

        # Save file temporarily
        file_id = secrets.token_hex(16)
        file_ext = Path(file.filename or "document").suffix
        saved_path = settings.upload_dir / f"{file_id}{file_ext}"

        with open(saved_path, "wb") as f:
            f.write(file_content)

        logger.info(f"Saved file to: {saved_path}")

        # Step 1: Extract text from document
        logger.info("Step 1: Extracting text from document...")
        ocr_result = await document_processor.process_document(
            file_content, file.filename or "document", file.content_type or ""
        )

        logger.info(
            f"Extracted {len(ocr_result.text)} characters "
            f"(confidence: {ocr_result.confidence:.2f})"
        )

        # Step 2: Analyze warranty with Claude AI
        logger.info("Step 2: Analyzing warranty with Claude AI...")
        analysis_result = await warranty_analyzer.analyze_warranty(ocr_result.text)

        logger.info(f"Analysis complete (confidence: {analysis_result.confidence_score:.2f})")

        # Step 3: Calculate dates if duration is available
        start_date = None
        expiry_date = None

        if analysis_result.duration_months:
            start_date, expiry_date = await warranty_analyzer.extract_warranty_dates(
                analysis_result.duration_months
            )

        # Step 4: Create response
        warranty_id = f"warranty_{file_id}"
        document_url = f"/uploads/{file_id}{file_ext}"  # In production, use S3/Cloud Storage

        response = WarrantyAnalysisResponse(
            id=warranty_id,
            status=WarrantyAnalysisStatus.COMPLETED,
            confidence_score=analysis_result.confidence_score,
            document_url=document_url,
            document_type=file.content_type or "",
            file_name=file.filename or "",
            file_size=file_size,
            contract_text=ocr_result.text,
            ocr_confidence=ocr_result.confidence,
            ai_summary=analysis_result.summary,
            duration=analysis_result.duration,
            duration_months=analysis_result.duration_months,
            start_date=start_date,
            expiry_date=expiry_date,
            coverage_items=analysis_result.coverage_items,
            exclusions=analysis_result.exclusions,
            limitations=analysis_result.limitations,
            claim_procedure=analysis_result.claim_procedure,
            claim_contacts=analysis_result.claim_contacts,
            required_docs=analysis_result.required_docs,
            critical_dates=analysis_result.critical_dates,
            transferable=analysis_result.transferable,
            extended_options=analysis_result.extended_options,
            critical_highlights=analysis_result.critical_highlights,
            warning_highlights=analysis_result.warning_highlights,
            info_highlights=analysis_result.info_highlights,
            ai_model=settings.claude_model,
            analysis_date=datetime.now(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        logger.info(f"Warranty analysis complete: {warranty_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing warranty: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze warranty: {str(e)}",
        )


@app.get(
    "/warranty-contract/{warranty_id}",
    response_model=WarrantyAnalysisResponse,
    tags=["Warranty Analysis"],
)
async def get_warranty_contract(warranty_id: str) -> WarrantyAnalysisResponse:
    """
    Retrieve a warranty contract analysis by ID

    - **warranty_id**: ID of the warranty contract
    """
    logger.info(f"Fetching warranty contract: {warranty_id}")

    # In production, fetch from database
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Warranty contract {warranty_id} not found",
    )


@app.post("/reanalyze", response_model=WarrantyAnalysisResponse, tags=["Warranty Analysis"])
async def reanalyze_warranty(request: ReanalyzeRequest) -> WarrantyAnalysisResponse:
    """
    Re-analyze an existing warranty contract

    Useful for:
    - Updating analysis with improved AI models
    - Correcting low-confidence extractions
    - Re-running with updated prompts

    - **warranty_id**: ID of warranty contract to reanalyze
    - **user_id**: User ID requesting reanalysis
    """
    logger.info(f"Reanalyzing warranty: {request.warranty_id}")

    # In production:
    # 1. Fetch existing warranty contract from database
    # 2. Re-run analysis with current AI model
    # 3. Update database with new analysis
    # 4. Return updated results

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Reanalysis feature coming soon",
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail or "An error occurred",
            detail=str(exc.detail) if exc.detail else None,
            status_code=exc.status_code,
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception) -> JSONResponse:
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.is_development else None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ).model_dump(),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
    )
