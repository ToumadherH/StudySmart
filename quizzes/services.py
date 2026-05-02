"""LLM-backed quiz generation and grading.

The system prompt lives next to this file in `prompt_template.txt`. It uses
Mustache-style placeholders (e.g. `{{SUBJECT_NAME}}`) that we replace before
sending the request, so the prompt itself stays readable and editable without
touching Python.

We talk to the Vercel AI Gateway via the OpenAI-compatible HTTP API, which
means we just need the `openai` Python SDK and an `AI_GATEWAY_API_KEY`.
"""
from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any, Iterable

from django.conf import settings

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent / "prompt_template.txt"

# Cap how much course material we forward to the LLM per request. The PDF
# extraction layer already truncates, but we keep an extra ceiling here in
# case someone bypasses it.
MAX_PDF_TEXT = 12_000

# Default question mix when the caller doesn't specify one.
DEFAULT_QUESTION_TYPES = ["mcq", "true_false", "short_answer"]


class QuizGenerationError(Exception):
    """Raised when the LLM call fails or returns unusable output."""


def _load_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _truncate(text: str, limit: int) -> str:
    if not text:
        return ""
    if len(text) <= limit:
        return text
    return text[:limit] + "\n... [truncated]"


def _fill_prompt(
    *,
    subject_name: str,
    course_pdf_text: str,
    language: str,
    difficulty: int,
    num_questions: int,
    question_types: Iterable[str],
    user_answers: Any,
) -> str:
    template = _load_prompt_template()
    replacements = {
        "{{SUBJECT_NAME}}": subject_name or "",
        "{{COURSE_PDF_TEXT}}": _truncate(course_pdf_text or "", MAX_PDF_TEXT),
        "{{LANGUAGE}}": language or "en",
        "{{DIFFICULTY}}": str(difficulty),
        "{{NUM_QUESTIONS}}": str(num_questions),
        "{{QUESTION_TYPES}}": json.dumps(list(question_types)),
        "{{USER_ANSWERS_JSON}}": "null" if user_answers is None else json.dumps(user_answers),
    }
    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)
    return template


def _extract_json_object(text: str) -> dict:
    """Coerce a model response into a JSON dict.

    Most modern models honour `response_format=json_object`, but we still
    defend against stray prose around the JSON payload.
    """
    if not text:
        raise QuizGenerationError("Empty response from model.")
    text = text.strip()
    # Strip ```json ... ``` fences if the model added them.
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fall back to grabbing the first {...} block.
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise QuizGenerationError("Model response is not valid JSON.")
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise QuizGenerationError(f"Model response is not valid JSON: {exc}") from exc


def _call_llm(prompt: str) -> dict:
    api_key = getattr(settings, "AI_GATEWAY_API_KEY", "") or ""
    if not api_key:
        raise QuizGenerationError(
            "AI_GATEWAY_API_KEY is not configured on the server."
        )

    try:
        from openai import OpenAI  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on env
        raise QuizGenerationError(
            "The `openai` Python package is not installed on the server."
        ) from exc

    client = OpenAI(
        api_key=api_key,
        base_url=getattr(settings, "AI_GATEWAY_BASE_URL", "https://ai-gateway.vercel.sh/v1"),
    )

    model = getattr(settings, "QUIZ_MODEL", "openai/gpt-5-mini")

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You output ONLY valid JSON that matches the schema described "
                        "by the user. No prose, no markdown fences."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
        )
    except Exception as exc:
        logger.exception("AI Gateway request failed")
        raise QuizGenerationError(f"AI Gateway request failed: {exc}") from exc

    try:
        content = response.choices[0].message.content or ""
    except (AttributeError, IndexError) as exc:
        raise QuizGenerationError("AI Gateway returned an empty response.") from exc

    return _extract_json_object(content)


def _normalize_quiz_payload(payload: dict, fallback_subject: str) -> dict:
    """Make sure the payload roughly matches the documented schema."""
    if not isinstance(payload, dict):
        raise QuizGenerationError("Model response is not a JSON object.")

    subject = payload.get("subject") or fallback_subject
    quiz = payload.get("quiz") or []
    if not isinstance(quiz, list):
        quiz = []

    cleaned_quiz: list[dict] = []
    for index, raw in enumerate(quiz, start=1):
        if not isinstance(raw, dict):
            continue
        question_id = str(raw.get("id") or f"q{index}")
        cleaned_quiz.append(
            {
                "id": question_id,
                "type": raw.get("type") or "short_answer",
                "question": raw.get("question") or "",
                "options": raw.get("options") or [],
                "correct_answer": raw.get("correct_answer") or "",
                "source_snippet": raw.get("source_snippet") or "",
                "insufficient_context": bool(raw.get("insufficient_context", False)),
            }
        )

    grading = payload.get("grading") or {"graded": False, "results": []}
    if not isinstance(grading, dict):
        grading = {"graded": False, "results": []}

    return {
        "subject": subject,
        "quiz": cleaned_quiz,
        "grading": grading,
    }


def _rating_label(percent: float, language: str) -> str:
    if percent >= 80:
        return "Excellent"
    if percent >= 60:
        return "Good" if language != "fr" else "Bien"
    return "Needs improvement" if language != "fr" else "À améliorer"


def generate_quiz(
    *,
    subject_name: str,
    course_pdf_text: str,
    language: str = "en",
    difficulty: int = 3,
    num_questions: int = 5,
    question_types: Iterable[str] | None = None,
) -> dict:
    """Generate quiz questions only (no grading)."""
    types = list(question_types) if question_types else DEFAULT_QUESTION_TYPES
    prompt = _fill_prompt(
        subject_name=subject_name,
        course_pdf_text=course_pdf_text,
        language=language,
        difficulty=difficulty,
        num_questions=num_questions,
        question_types=types,
        user_answers=None,
    )
    payload = _call_llm(prompt)
    return _normalize_quiz_payload(payload, fallback_subject=subject_name)


def grade_quiz(
    *,
    subject_name: str,
    course_pdf_text: str,
    language: str,
    difficulty: int,
    num_questions: int,
    question_types: Iterable[str],
    questions: list[dict],
    user_answers: list[dict],
) -> dict:
    """Send previously generated questions plus user answers back for grading.

    We forward the original questions in the prompt as `course_pdf_text` plus
    the `user_answers` array. The LLM follows the schema in the template and
    returns a `grading` object that we normalize before persisting.
    """
    types = list(question_types) if question_types else DEFAULT_QUESTION_TYPES
    # We pack the questions into the prompt so the model grades the EXACT
    # questions we showed the user, even if it would otherwise paraphrase.
    grading_context = (
        "PREVIOUSLY GENERATED QUESTIONS (grade these exact items, do not invent new ones):\n"
        + json.dumps(questions, ensure_ascii=False)
        + "\n\nORIGINAL COURSE TEXT:\n"
        + (course_pdf_text or "")
    )
    prompt = _fill_prompt(
        subject_name=subject_name,
        course_pdf_text=grading_context,
        language=language,
        difficulty=difficulty,
        num_questions=num_questions,
        question_types=types,
        user_answers=user_answers,
    )
    payload = _call_llm(prompt)
    normalized = _normalize_quiz_payload(payload, fallback_subject=subject_name)

    grading = normalized.get("grading") or {}
    results = grading.get("results") if isinstance(grading.get("results"), list) else []

    score_total = 0
    score_max = len(questions)
    for result in results:
        try:
            score_total += int(bool(result.get("is_correct"))) if "is_correct" in result else int(result.get("score") or 0)
        except (TypeError, ValueError):
            continue

    score_percent = round((score_total / score_max) * 100, 1) if score_max else 0.0
    rating = grading.get("rating_label") or _rating_label(score_percent, language)

    grading.update(
        {
            "graded": True,
            "results": results,
            "score_total": score_total,
            "score_max": score_max,
            "score_percent": score_percent,
            "rating_label": rating,
        }
    )
    normalized["grading"] = grading
    # Preserve the same questions on the output so the frontend has a single
    # source of truth coming back from the grade endpoint.
    if not normalized.get("quiz"):
        normalized["quiz"] = questions
    return normalized
