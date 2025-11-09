"""
Document processing module for extracting text from PDFs and images
Supports OCR for scanned documents using Claude Vision API
"""

import base64
import io
import logging
from pathlib import Path
from typing import BinaryIO

import anthropic
from PIL import Image
from PyPDF2 import PdfReader

from app.config import get_settings
from app.models import DocumentType, OCRResult

logger = logging.getLogger(__name__)
settings = get_settings()


class DocumentProcessor:
    """Process warranty documents and extract text"""

    def __init__(self) -> None:
        """Initialize document processor"""
        self.anthropic_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    async def process_document(
        self, file_content: bytes, file_name: str, mime_type: str
    ) -> OCRResult:
        """
        Process a document and extract text

        Args:
            file_content: Binary content of the file
            file_name: Name of the file
            mime_type: MIME type of the file

        Returns:
            OCRResult with extracted text and confidence score
        """
        logger.info(f"Processing document: {file_name} (type: {mime_type})")

        try:
            if mime_type == DocumentType.PDF.value:
                return await self._process_pdf(file_content)
            elif mime_type in [
                DocumentType.PNG.value,
                DocumentType.JPEG.value,
                DocumentType.JPG.value,
            ]:
                return await self._process_image_with_claude(file_content, mime_type)
            else:
                raise ValueError(f"Unsupported document type: {mime_type}")

        except Exception as e:
            logger.error(f"Error processing document {file_name}: {e}", exc_info=True)
            raise

    async def _process_pdf(self, file_content: bytes) -> OCRResult:
        """
        Extract text from PDF file

        Args:
            file_content: Binary content of PDF

        Returns:
            OCRResult with extracted text
        """
        logger.info("Processing PDF document")

        try:
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)

            text_parts: list[str] = []
            page_count = len(reader.pages)

            for page_num, page in enumerate(reader.pages, 1):
                logger.debug(f"Extracting text from page {page_num}/{page_count}")
                text = page.extract_text()
                if text.strip():
                    text_parts.append(f"--- Page {page_num} ---\n{text}")

            extracted_text = "\n\n".join(text_parts)

            # Check if PDF has extractable text or needs OCR
            if len(extracted_text.strip()) < 50:
                logger.warning("PDF appears to be scanned/image-based, using Claude Vision for OCR")
                # Convert PDF to images and use Claude Vision
                return await self._process_scanned_pdf(file_content, page_count)

            # Calculate confidence based on text extraction success
            confidence = 0.95 if len(extracted_text) > 100 else 0.7

            return OCRResult(
                text=extracted_text.strip(),
                confidence=confidence,
                page_count=page_count,
            )

        except Exception as e:
            logger.error(f"Error processing PDF: {e}", exc_info=True)
            raise

    async def _process_scanned_pdf(self, file_content: bytes, page_count: int) -> OCRResult:
        """
        Process scanned PDF using Claude Vision API

        Args:
            file_content: Binary content of PDF
            page_count: Number of pages

        Returns:
            OCRResult with OCR-extracted text
        """
        logger.info("Processing scanned PDF with Claude Vision")

        try:
            # For MVP, we'll convert first few pages to images
            # In production, consider using pdf2image library
            from pdf2image import convert_from_bytes

            images = convert_from_bytes(file_content, dpi=200, fmt="png")
            logger.info(f"Converted PDF to {len(images)} images")

            text_parts: list[str] = []

            # Process each page (limit to first 10 pages for cost control)
            for idx, image in enumerate(images[:10], 1):
                logger.debug(f"Processing page {idx} with Claude Vision")

                # Convert PIL Image to bytes
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format="PNG")
                img_bytes = img_byte_arr.getvalue()

                # Extract text using Claude Vision
                page_text = await self._extract_text_with_claude_vision(
                    img_bytes, DocumentType.PNG.value
                )
                text_parts.append(f"--- Page {idx} ---\n{page_text}")

            extracted_text = "\n\n".join(text_parts)

            # OCR confidence is typically lower than direct text extraction
            confidence = 0.85 if len(extracted_text) > 100 else 0.6

            return OCRResult(
                text=extracted_text.strip(),
                confidence=confidence,
                page_count=len(images),
            )

        except ImportError:
            logger.error("pdf2image library not available, cannot process scanned PDFs")
            raise ValueError("Cannot process scanned PDFs without pdf2image library")
        except Exception as e:
            logger.error(f"Error processing scanned PDF: {e}", exc_info=True)
            raise

    async def _process_image_with_claude(self, file_content: bytes, mime_type: str) -> OCRResult:
        """
        Process image file using Claude Vision API

        Args:
            file_content: Binary content of image
            mime_type: MIME type of image

        Returns:
            OCRResult with extracted text
        """
        logger.info(f"Processing image with Claude Vision (type: {mime_type})")

        try:
            # Validate and optimize image
            optimized_image = await self._optimize_image(file_content)

            # Extract text using Claude Vision
            extracted_text = await self._extract_text_with_claude_vision(
                optimized_image, mime_type
            )

            # Vision OCR typically has good confidence
            confidence = 0.88 if len(extracted_text) > 50 else 0.65

            return OCRResult(
                text=extracted_text.strip(),
                confidence=confidence,
                page_count=1,
            )

        except Exception as e:
            logger.error(f"Error processing image: {e}", exc_info=True)
            raise

    async def _optimize_image(self, image_bytes: bytes) -> bytes:
        """
        Optimize image for Claude Vision API

        Args:
            image_bytes: Original image bytes

        Returns:
            Optimized image bytes
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))

            # Convert to RGB if necessary
            if image.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "P":
                    image = image.convert("RGBA")
                background.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
                image = background

            # Resize if too large (Claude has size limits)
            max_dimension = 2048
            if max(image.size) > max_dimension:
                ratio = max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                logger.debug(f"Resized image to {new_size}")

            # Save optimized image
            output = io.BytesIO()
            image.save(output, format="PNG", optimize=True)
            return output.getvalue()

        except Exception as e:
            logger.warning(f"Image optimization failed, using original: {e}")
            return image_bytes

    async def _extract_text_with_claude_vision(
        self, image_bytes: bytes, mime_type: str
    ) -> str:
        """
        Extract text from image using Claude Vision API

        Args:
            image_bytes: Image binary data
            mime_type: MIME type of image

        Returns:
            Extracted text from image
        """
        try:
            # Encode image to base64
            image_base64 = base64.standard_b64encode(image_bytes).decode("utf-8")

            # Create message with vision
            message = self.anthropic_client.messages.create(
                model=settings.claude_model,
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": mime_type,
                                    "data": image_base64,
                                },
                            },
                            {
                                "type": "text",
                                "text": """Extract ALL text from this warranty document image.

Include:
- All headings and titles
- All body text and paragraphs
- Tables and lists
- Fine print and footnotes
- Contact information
- Dates and numbers

Preserve the structure and formatting as much as possible.
Output ONLY the extracted text, nothing else.""",
                            },
                        ],
                    }
                ],
            )

            # Extract text from response
            extracted_text = ""
            for block in message.content:
                if hasattr(block, "text"):
                    extracted_text += block.text

            logger.info(f"Extracted {len(extracted_text)} characters from image using Claude Vision")
            return extracted_text.strip()

        except Exception as e:
            logger.error(f"Claude Vision API error: {e}", exc_info=True)
            raise RuntimeError(f"Failed to extract text with Claude Vision: {e}")
