#!/usr/bin/env python3
"""
Simple test script to verify warranty analyzer service
"""

import asyncio
import sys
from pathlib import Path

try:
    from app.document_processor import DocumentProcessor
    from app.warranty_analyzer import WarrantyAnalyzer
except ImportError:
    print("Error: Could not import app modules. Make sure you're in the warranty-analyzer directory.")
    print("Run: cd website/services/warranty-analyzer")
    sys.exit(1)


async def test_warranty_analyzer():
    """Test the warranty analyzer with sample text"""

    print("🧪 Testing Warranty Analyzer Service\n")

    # Sample warranty text
    sample_warranty_text = """
    LIMITED WARRANTY

    Warranty Period: 24 months from date of purchase

    What's Covered:
    - Manufacturing defects in materials and workmanship
    - Replacement parts and labor
    - Shipping costs for warranty repairs

    What's NOT Covered:
    - Water damage or liquid spills
    - Accidental damage or drops
    - Normal wear and tear
    - Cosmetic damage (scratches, dents)
    - Damage from unauthorized repairs
    - Commercial use

    How to File a Claim:
    1. Contact customer service at 1-800-555-0123 or warranty@company.com
    2. Provide proof of purchase (receipt or order number)
    3. Describe the issue and provide photos if possible
    4. Ship product to our service center if approved

    Important Notes:
    - Product must be registered within 30 days of purchase
    - Unauthorized repairs will void this warranty
    - This warranty is non-transferable
    - Extended warranty options available for purchase

    Contact Information:
    Phone: 1-800-555-0123
    Email: warranty@company.com
    Website: https://company.com/warranty
    Address: 123 Warranty St, Support City, SC 12345
    """

    print("1️⃣  Creating warranty analyzer instance...")
    try:
        analyzer = WarrantyAnalyzer()
        print("   ✅ Analyzer created successfully\n")
    except Exception as e:
        print(f"   ❌ Failed to create analyzer: {e}")
        return False

    print("2️⃣  Analyzing sample warranty text...")
    print("   " + "=" * 60)
    print(f"   Sample text: {len(sample_warranty_text)} characters")
    print("   " + "=" * 60 + "\n")

    try:
        result = await analyzer.analyze_warranty(sample_warranty_text)
        print("   ✅ Analysis complete!\n")
    except Exception as e:
        print(f"   ❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("3️⃣  Analysis Results:")
    print("   " + "=" * 60)
    print(f"   📋 Summary: {result.summary[:100]}...")
    print(f"   ⏰ Duration: {result.duration} ({result.duration_months} months)")
    print(f"   📊 Confidence: {result.confidence_score:.2%}")
    print()

    print("   ✅ Coverage Items:")
    for item in result.coverage_items[:3]:
        print(f"      • {item}")
    if len(result.coverage_items) > 3:
        print(f"      ... and {len(result.coverage_items) - 3} more")
    print()

    print("   ❌ Exclusions:")
    for item in result.exclusions[:3]:
        print(f"      • {item}")
    if len(result.exclusions) > 3:
        print(f"      ... and {len(result.exclusions) - 3} more")
    print()

    print("   📞 Contact Info:")
    if result.claim_contacts.get("phone"):
        print(f"      Phone: {result.claim_contacts['phone']}")
    if result.claim_contacts.get("email"):
        print(f"      Email: {result.claim_contacts['email']}")
    if result.claim_contacts.get("website"):
        print(f"      Website: {result.claim_contacts['website']}")
    print()

    print("   🔴 Critical Highlights:")
    for highlight in result.critical_highlights:
        print(f"      {highlight['icon']} {highlight['text'][:60]}...")
    print()

    print("   ⚠️  Warning Highlights:")
    for highlight in result.warning_highlights:
        print(f"      {highlight['icon']} {highlight['text'][:60]}...")
    print()

    print("   " + "=" * 60 + "\n")

    print("✅ All tests passed!\n")
    return True


async def test_document_processor():
    """Test document processor initialization"""

    print("🧪 Testing Document Processor\n")

    print("1️⃣  Creating document processor instance...")
    try:
        processor = DocumentProcessor()
        print("   ✅ Processor created successfully\n")
        return True
    except Exception as e:
        print(f"   ❌ Failed to create processor: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""

    print("\n" + "=" * 60)
    print("  WARRANTY ANALYZER SERVICE TEST SUITE")
    print("=" * 60 + "\n")

    # Test 1: Document Processor
    test1_passed = await test_document_processor()

    # Test 2: Warranty Analyzer
    test2_passed = await test_warranty_analyzer()

    # Summary
    print("=" * 60)
    print("  TEST SUMMARY")
    print("=" * 60)
    print(f"  Document Processor: {'✅ PASS' if test1_passed else '❌ FAIL'}")
    print(f"  Warranty Analyzer:  {'✅ PASS' if test2_passed else '❌ FAIL'}")
    print("=" * 60 + "\n")

    if test1_passed and test2_passed:
        print("🎉 All tests passed! Your warranty analyzer is working correctly.\n")
        print("Next steps:")
        print("  1. Start the service: docker-compose up -d")
        print("  2. Visit http://localhost:8001/docs")
        print("  3. Upload a warranty document to test\n")
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.\n")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
