"""
Warranty Analysis using Claude AI
Extracts structured information from warranty contract text
"""

import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any

import anthropic

from app.config import get_settings
from app.models import ClaudeAnalysisResult

logger = logging.getLogger(__name__)
settings = get_settings()


class WarrantyAnalyzer:
    """Analyze warranty contracts using Claude AI"""

    def __init__(self) -> None:
        """Initialize warranty analyzer"""
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    async def analyze_warranty(self, contract_text: str) -> ClaudeAnalysisResult:
        """
        Analyze warranty contract text and extract structured information

        Args:
            contract_text: Full text of warranty contract

        Returns:
            ClaudeAnalysisResult with extracted warranty information
        """
        logger.info(f"Analyzing warranty contract ({len(contract_text)} characters)")

        try:
            # Create analysis prompt
            prompt = self._create_analysis_prompt(contract_text)

            # Call Claude API
            message = self.client.messages.create(
                model=settings.claude_model,
                max_tokens=settings.claude_max_tokens,
                temperature=settings.claude_temperature,
                messages=[{"role": "user", "content": prompt}],
            )

            # Extract response text
            response_text = ""
            for block in message.content:
                if hasattr(block, "text"):
                    response_text += block.text

            logger.debug(f"Claude response: {response_text[:200]}...")

            # Parse JSON response
            analysis_data = self._parse_analysis_response(response_text)

            # Create result object
            result = ClaudeAnalysisResult(**analysis_data)

            logger.info(
                f"Warranty analysis complete (confidence: {result.confidence_score:.2f})"
            )
            return result

        except Exception as e:
            logger.error(f"Error analyzing warranty: {e}", exc_info=True)
            raise

    def _create_analysis_prompt(self, contract_text: str) -> str:
        """
        Create analysis prompt for Claude

        Args:
            contract_text: Warranty contract text

        Returns:
            Formatted prompt for Claude
        """
        return f"""You are an expert warranty contract analyzer. Analyze the following warranty document and extract key information.

WARRANTY CONTRACT TEXT:
---
{contract_text}
---

Extract and structure the following information. Return your response as valid JSON matching this exact schema:

{{
  "summary": "Plain language summary (2-3 sentences explaining what this warranty covers)",
  "duration": "Warranty duration as written (e.g., '24 months', '2 years', 'lifetime')",
  "duration_months": <number of months or null if lifetime/unclear>,
  "coverage_items": ["List of what IS covered", "..."],
  "exclusions": ["List of what is NOT covered", "..."],
  "limitations": ["List of conditions/limitations", "..."],
  "claim_procedure": "Step-by-step procedure for filing claims",
  "claim_contacts": {{
    "phone": "phone number or null",
    "email": "email address or null",
    "website": "website URL or null",
    "address": "mailing address or null"
  }},
  "required_docs": ["Documents needed to file claim", "..."],
  "critical_dates": [
    {{
      "date": "YYYY-MM-DD or description",
      "description": "what this date represents",
      "type": "registration_deadline|expiry|inspection_required|other"
    }}
  ],
  "transferable": true/false/null,
  "extended_options": "Information about extended warranty options or null",
  "critical_highlights": [
    {{
      "text": "Critical information user MUST know",
      "category": "critical",
      "icon": "🔴",
      "importance": 5
    }}
  ],
  "warning_highlights": [
    {{
      "text": "Important warnings or exclusions",
      "category": "warning",
      "icon": "⚠️",
      "importance": 4
    }}
  ],
  "info_highlights": [
    {{
      "text": "Useful information",
      "category": "info",
      "icon": "✅",
      "importance": 3
    }}
  ],
  "confidence_score": <0.0-1.0, your confidence in the extraction accuracy>
}}

IMPORTANT INSTRUCTIONS:
1. Extract ALL relevant information from the warranty text
2. Be specific - include actual deadlines, contact info, procedures
3. Categorize highlights appropriately:
   - CRITICAL: Deadlines, registration requirements, conditions that void warranty
   - WARNING: Major exclusions, limitations, things that aren't covered
   - INFO: Covered items, how to file claims, contact information
4. For duration_months: convert any time period to months (1 year = 12, lifetime = null)
5. For dates: extract any specific dates or calculate based on "from purchase date"
6. Confidence score should reflect how complete and clear the extracted information is
7. Use null for any fields where information is not available
8. Return ONLY valid JSON, no other text

Analyze the warranty now and return the JSON:"""

    def _parse_analysis_response(self, response_text: str) -> dict[str, Any]:
        """
        Parse Claude's response into structured data

        Args:
            response_text: Raw response from Claude

        Returns:
            Dictionary of extracted warranty information
        """
        try:
            # Extract JSON from response (Claude might add explanation)
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = response_text

            # Parse JSON
            data = json.loads(json_str)

            # Validate and set defaults
            result = {
                "summary": data.get("summary", ""),
                "duration": data.get("duration"),
                "duration_months": data.get("duration_months"),
                "coverage_items": data.get("coverage_items", []),
                "exclusions": data.get("exclusions", []),
                "limitations": data.get("limitations", []),
                "claim_procedure": data.get("claim_procedure"),
                "claim_contacts": data.get("claim_contacts", {}),
                "required_docs": data.get("required_docs", []),
                "critical_dates": data.get("critical_dates", []),
                "transferable": data.get("transferable"),
                "extended_options": data.get("extended_options"),
                "critical_highlights": data.get("critical_highlights", []),
                "warning_highlights": data.get("warning_highlights", []),
                "info_highlights": data.get("info_highlights", []),
                "confidence_score": data.get("confidence_score", 0.5),
            }

            # Validate confidence score
            if not (0.0 <= result["confidence_score"] <= 1.0):
                logger.warning(f"Invalid confidence score: {result['confidence_score']}, using 0.5")
                result["confidence_score"] = 0.5

            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Response text: {response_text}")

            # Return minimal valid response
            return {
                "summary": "Failed to analyze warranty contract",
                "duration": None,
                "duration_months": None,
                "coverage_items": [],
                "exclusions": [],
                "limitations": [],
                "claim_procedure": None,
                "claim_contacts": {},
                "required_docs": [],
                "critical_dates": [],
                "transferable": None,
                "extended_options": None,
                "critical_highlights": [],
                "warning_highlights": [],
                "info_highlights": [],
                "confidence_score": 0.1,
            }

    async def extract_warranty_dates(
        self, duration_months: int | None, purchase_date: datetime | None = None
    ) -> tuple[datetime | None, datetime | None]:
        """
        Calculate warranty start and expiry dates

        Args:
            duration_months: Warranty duration in months
            purchase_date: Purchase date (uses today if None)

        Returns:
            Tuple of (start_date, expiry_date)
        """
        if duration_months is None:
            return (None, None)

        start_date = purchase_date or datetime.now()
        expiry_date = start_date + timedelta(days=duration_months * 30)

        return (start_date, expiry_date)
