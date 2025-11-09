"""
Database connection and operations
"""

import json
import logging
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.models import WarrantyAnalysisStatus

logger = logging.getLogger(__name__)
settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.is_development,
    pool_pre_ping=True,
)

# Create session maker
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """Get database session"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


class WarrantyContractDB:
    """Database operations for warranty contracts"""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize with database session"""
        self.session = session

    async def create_warranty_contract(
        self,
        user_id: str,
        product_id: str | None,
        document_url: str,
        document_type: str,
        file_name: str,
        file_size: int,
        contract_text: str,
        ocr_confidence: float | None,
        analysis_data: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Create a new warranty contract record

        Args:
            user_id: User ID
            product_id: Optional product ID
            document_url: URL to document
            document_type: MIME type
            file_name: File name
            file_size: File size in bytes
            contract_text: Extracted text
            ocr_confidence: OCR confidence score
            analysis_data: Analyzed warranty data

        Returns:
            Created warranty contract data
        """
        # For MVP, we'll use raw SQL since Prisma client needs to be generated
        # In production, use proper ORM/Prisma client

        warranty_data = {
            "id": self._generate_id(),
            "userId": user_id,
            "productId": product_id,
            "documentUrl": document_url,
            "documentType": document_type,
            "fileName": file_name,
            "fileSize": file_size,
            "contractText": contract_text,
            "ocrConfidence": ocr_confidence,
            "aiSummary": analysis_data.get("summary"),
            "confidenceScore": analysis_data.get("confidence_score"),
            "duration": analysis_data.get("duration"),
            "durationMonths": analysis_data.get("duration_months"),
            "coverageItems": json.dumps(analysis_data.get("coverage_items", [])),
            "exclusions": json.dumps(analysis_data.get("exclusions", [])),
            "limitations": json.dumps(analysis_data.get("limitations", [])),
            "claimProcedure": analysis_data.get("claim_procedure"),
            "claimContacts": json.dumps(analysis_data.get("claim_contacts", {})),
            "requiredDocs": json.dumps(analysis_data.get("required_docs", [])),
            "criticalDates": json.dumps(analysis_data.get("critical_dates", [])),
            "transferable": analysis_data.get("transferable"),
            "extendedOptions": analysis_data.get("extended_options"),
            "criticalHighlights": json.dumps(analysis_data.get("critical_highlights", [])),
            "warningHighlights": json.dumps(analysis_data.get("warning_highlights", [])),
            "infoHighlights": json.dumps(analysis_data.get("info_highlights", [])),
            "status": WarrantyAnalysisStatus.COMPLETED.value,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "analysisDate": datetime.now().isoformat(),
        }

        logger.info(f"Created warranty contract: {warranty_data['id']}")
        return warranty_data

    async def get_warranty_contract(self, warranty_id: str) -> dict[str, Any] | None:
        """
        Get warranty contract by ID

        Args:
            warranty_id: Warranty contract ID

        Returns:
            Warranty contract data or None
        """
        # Mock implementation for MVP
        # In production, query actual database
        logger.info(f"Fetching warranty contract: {warranty_id}")
        return None

    async def update_warranty_contract(
        self, warranty_id: str, updates: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Update warranty contract

        Args:
            warranty_id: Warranty contract ID
            updates: Fields to update

        Returns:
            Updated warranty contract data
        """
        logger.info(f"Updating warranty contract: {warranty_id}")
        updates["updatedAt"] = datetime.now().isoformat()
        return updates

    def _generate_id(self) -> str:
        """Generate unique ID (CUID style)"""
        import secrets
        import time

        timestamp = str(int(time.time() * 1000))
        random_part = secrets.token_hex(8)
        return f"clw{timestamp[-8:]}{random_part}"
