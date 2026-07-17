import hashlib
import re

from app.artifact.contracts import ArtifactProcessor, EmbeddingProvider
from app.artifact.models import Artifact, EvidenceFeatures
from app.domain.enums import ArtifactType


class ArtifactClassifier(ArtifactProcessor):
    async def process(self, artifact: Artifact) -> Artifact:
        return artifact.model_copy(update={"artifact_type": ArtifactType.PLAIN_TEXT})


class TextExtractor(ArtifactProcessor):
    async def process(self, artifact: Artifact) -> Artifact:
        if artifact.media_type != "text/plain":
            raise ValueError("Only text/plain is supported in Phase 2")
        return artifact.model_copy(update={"extracted_text": artifact.content})


class TextNormalizer(ArtifactProcessor):
    async def process(self, artifact: Artifact) -> Artifact:
        text = artifact.extracted_text or artifact.content
        normalized = re.sub(r"\s+", " ", text).strip()
        return artifact.model_copy(update={"normalized_text": normalized})


class PiiRedactor(ArtifactProcessor):
    _patterns = (
        (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"), "[EMAIL_REDACTED]"),
        (re.compile(r"(?<!\d)(?:\+?\d[\d ()-]{8,}\d)(?!\d)"), "[PHONE_REDACTED]"),
    )

    async def process(self, artifact: Artifact) -> Artifact:
        redacted = artifact.normalized_text or artifact.extracted_text or artifact.content
        was_redacted = False
        for pattern, replacement in self._patterns:
            redacted, count = pattern.subn(replacement, redacted)
            was_redacted = was_redacted or count > 0
        return artifact.model_copy(
            update={
                "redacted_text": redacted,
                "metadata": {**artifact.metadata, "pii_redacted": was_redacted},
            }
        )


class MetadataExtractor(ArtifactProcessor):
    async def process(self, artifact: Artifact) -> Artifact:
        text = artifact.redacted_text or artifact.normalized_text or artifact.content
        metadata = {
            **artifact.metadata,
            "sha256": hashlib.sha256(artifact.content.encode()).hexdigest(),
            "character_count": len(text),
            "word_count": len(text.split()),
            "line_count": artifact.content.count("\n") + 1,
        }
        return artifact.model_copy(update={"metadata": metadata})


class EvidenceFeatureExtractor(ArtifactProcessor):
    _financial_terms = re.compile(r"\b(invoice|payment|wire|transfer|bank|money|funds)\b", re.I)
    _credential_terms = re.compile(
        r"\b(password|passcode|otp|login|credential|verification code)\b", re.I
    )
    _threat_terms = re.compile(r"\b(urgent|immediately| 마지막|suspend|legal action|警告)\b", re.I)
    _domain_pattern = re.compile(r"\b(?:https?://|www\.)[^\s]+", re.I)

    async def process(self, artifact: Artifact) -> Artifact:
        text = artifact.redacted_text or artifact.normalized_text or artifact.content
        words = text.split()
        caps_words = [word for word in words if len(word) > 2 and word.isupper()]
        greeting = "formal" if re.search(r"\b(dear|hello)\b", text, re.I) else "informal"
        features = EvidenceFeatures(
            all_caps_ratio=round(len(caps_words) / max(len(words), 1), 4),
            exclamation_count=text.count("!"),
            financial_request=bool(self._financial_terms.search(text)),
            credential_request=bool(self._credential_terms.search(text)),
            suspicious_domain=bool(self._domain_pattern.search(text)),
            threat_language=bool(self._threat_terms.search(text)),
            greeting_style=greeting,
        )
        return artifact.model_copy(update={"evidence_features": features})


class TextChunker(ArtifactProcessor):
    def __init__(self, chunk_size: int = 500) -> None:
        self._chunk_size = chunk_size

    async def process(self, artifact: Artifact) -> Artifact:
        text = artifact.redacted_text or artifact.normalized_text or artifact.content
        chunks = [
            text[index : index + self._chunk_size]
            for index in range(0, len(text), self._chunk_size)
        ]
        return artifact.model_copy(update={"chunks": chunks or [""]})


class DeterministicEmbeddingProvider(EmbeddingProvider):
    """Stable local placeholder; replaceable by OpenAI/Voyage/Cohere adapters later."""

    dimension = 8

    async def embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            seed = hashlib.sha256(text.encode()).digest()
            vectors.append(
                [round(((seed[index] / 255) * 2) - 1, 6) for index in range(self.dimension)]
            )
        return vectors


def tokens(text: str) -> set[str]:
    return {token.lower() for token in re.findall(r"[a-zA-Z][a-zA-Z'-]{1,}", text)}


def identity_features(text: str):
    from app.artifact.models import IdentityFeatures

    words = text.split()
    sentences = [part for part in re.split(r"[.!?]+", text) if part.strip()]
    vocabulary = tokens(text)
    return IdentityFeatures(
        vocabulary_richness=round(len(vocabulary) / max(len(words), 1), 4),
        average_sentence_length=round(len(words) / max(len(sentences), 1), 2),
        greeting_style="formal" if re.search(r"\b(dear|hello)\b", text, re.I) else "informal",
        signature_style="signoff"
        if re.search(r"\b(best|regards|sincerely)\b", text, re.I)
        else "none",
        emoji_frequency=round(sum(ord(char) > 0x1F000 for char in text) / max(len(text), 1), 4),
        professional_tone=round(
            len(re.findall(r"\b(strategy|product|team|project|research)\b", text, re.I))
            / max(len(words), 1),
            4,
        ),
        domain_terms=sorted(vocabulary)[:12],
        average_response_length=float(len(words)),
        punctuation_habits={mark: text.count(mark) for mark in (",", ";", ":", "!")},
    )
