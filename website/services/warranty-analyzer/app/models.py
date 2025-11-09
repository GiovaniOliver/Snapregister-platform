"""
Pydantic models for request/response validation
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class WarrantyAnalysisStatus(str, Enum):
    """Status of warranty analysis"""

    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    FAILED = "FAILED"
    REANALYZING = "REANALYZING"


class DocumentType(str, Enum):
    """Supported document types"""

    PDF = "application/pdf"
    PNG = "image/png"
    JPEG = "image/jpeg"
    JPG = "image/jpg"


class WarrantyAnalysisRequest(BaseModel):
    """Request model for analyzing warranty document"""

    user_id: str = Field(..., description="User ID who owns this warranty")
    product_id: str | None = Field(None, description="Optional product ID to link warranty to")


class ClaimContact(BaseModel):
    """Contact information for warranty claims"""

    phone: str | None = None
    email: str | None = None
    website: str | None = None
    address: str | None = None


class CriticalDate(BaseModel):
    """Important date in warranty contract"""

    date: datetime | str
    description: str
    type: str  # "registration_deadline", "expiry", "inspection_required", etc.


class WarrantyHighlight(BaseModel):
    """A highlighted piece of information from the warranty"""

    text: str
    category: str  # "critical", "warning", "info"
    icon: str  # emoji or icon name
    importance: int = Field(ge=1, le=5, description="Importance level 1-5")


class WarrantyAnalysisResponse(BaseModel):
    """Response model for warranty analysis"""

    id: str
    status: WarrantyAnalysisStatus
    confidence_score: float | None = Field(
        None, ge=0.0, le=1.0, description="AI confidence in extraction (0-1)"
    )

    # Document Info
    document_url: str
    document_type: str
    file_name: str
    file_size: int

    # Extracted Text
    contract_text: str | None = None
    ocr_confidence: float | None = Field(
        None, ge=0.0, le=1.0, description="OCR confidence (0-1)"
    )

    # AI Analysis
    ai_summary: str | None = None

    # Warranty Details
    duration: str | None = None
    duration_months: int | None = None
    start_date: datetime | None = None
    expiry_date: datetime | None = None

    # Coverage
    coverage_items: list[str] = Field(default_factory=list)
    exclusions: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)

    # Claims
    claim_procedure: str | None = None
    claim_contacts: ClaimContact = Field(default_factory=ClaimContact)
    required_docs: list[str] = Field(default_factory=list)

    # Important Dates
    critical_dates: list[CriticalDate] = Field(default_factory=list)

    # Additional Terms
    transferable: bool | None = None
    extended_options: str | None = None

    # Highlights
    critical_highlights: list[WarrantyHighlight] = Field(default_factory=list)
    warning_highlights: list[WarrantyHighlight] = Field(default_factory=list)
    info_highlights: list[WarrantyHighlight] = Field(default_factory=list)

    # Metadata
    ai_model: str
    analysis_date: datetime
    error_message: str | None = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "clxyz123456",
                "status": "COMPLETED",
                "confidence_score": 0.92,
                "document_url": "https://s3.amazonaws.com/warranties/doc123.pdf",
                "document_type": "application/pdf",
                "file_name": "warranty.pdf",
                "file_size": 524288,
                "ai_summary": "This is a standard 2-year limited warranty...",
                "duration": "24 months",
                "duration_months": 24,
                "coverage_items": ["Manufacturing defects", "Parts replacement"],
                "exclusions": ["Water damage", "Normal wear and tear"],
            }
        }


class ReanalyzeRequest(BaseModel):
    """Request to reanalyze a warranty contract"""

    warranty_id: str = Field(..., description="ID of warranty contract to reanalyze")
    user_id: str = Field(..., description="User ID requesting reanalysis")


class HealthCheckResponse(BaseModel):
    """Health check response"""

    status: str
    version: str
    timestamp: datetime
    services: dict[str, bool]


class ErrorResponse(BaseModel):
    """Error response model"""

    error: str
    detail: str | None = None
    status_code: int


class OCRResult(BaseModel):
    """OCR extraction result"""

    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    page_count: int = 1


class ClaudeAnalysisResult(BaseModel):
    """Result from Claude AI analysis"""

    summary: str
    duration: str | None = None
    duration_months: int | None = None
    coverage_items: list[str] = Field(default_factory=list)
    exclusions: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    claim_procedure: str | None = None
    claim_contacts: dict[str, Any] = Field(default_factory=dict)
    required_docs: list[str] = Field(default_factory=list)
    critical_dates: list[dict[str, Any]] = Field(default_factory=list)
    transferable: bool | None = None
    extended_options: str | None = None
    critical_highlights: list[dict[str, Any]] = Field(default_factory=list)
    warning_highlights: list[dict[str, Any]] = Field(default_factory=list)
    info_highlights: list[dict[str, Any]] = Field(default_factory=list)
    confidence_score: float = Field(ge=0.0, le=1.0)
