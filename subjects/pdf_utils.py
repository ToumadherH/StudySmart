"""PDF text extraction helpers.

We keep this small and dependency-free at import time so the rest of the
backend does not crash if `pypdf` is missing in some environment. The actual
extraction is best-effort: a corrupt or image-only PDF will simply yield an
empty string and the quiz endpoint will fall back to "insufficient_context".
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# How much text we keep per PDF. Most LLM context windows handle far more,
# but capping protects us from accidentally sending a 500-page textbook.
MAX_TEXT_CHARS = 60_000


def extract_pdf_text(file_field) -> str:
    """Extract text from a Django FileField/UploadedFile pointing at a PDF.

    Returns an empty string on any failure; callers can decide whether to
    surface that to the user.
    """
    try:
        from pypdf import PdfReader  # type: ignore
    except Exception:
        logger.warning("pypdf is not installed; PDF text extraction skipped.")
        return ""

    # FileField has a `.open(mode)` helper that handles both freshly uploaded
    # InMemoryUploadedFile/TemporaryUploadedFile and stored files.
    try:
        file_field.open('rb')
    except Exception:
        logger.exception("Could not open PDF file for extraction.")
        return ""

    try:
        reader = PdfReader(file_field)
        chunks: list[str] = []
        total = 0
        for page in reader.pages:
            try:
                page_text = page.extract_text() or ""
            except Exception:
                page_text = ""
            if not page_text:
                continue
            chunks.append(page_text)
            total += len(page_text)
            if total >= MAX_TEXT_CHARS:
                break
        text = "\n\n".join(chunks).strip()
        if len(text) > MAX_TEXT_CHARS:
            text = text[:MAX_TEXT_CHARS]
        return text
    except Exception:
        logger.exception("Failed while parsing PDF.")
        return ""
    finally:
        try:
            file_field.close()
        except Exception:
            pass
