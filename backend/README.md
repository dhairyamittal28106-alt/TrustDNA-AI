# TrustDNA API

Phase 1 backend foundation. This service intentionally uses in-memory adapters: persistence, migrations, and PostgreSQL arrive in Sprint 2 after domain contracts are stable.

```powershell
uv sync --python 3.12
uv run uvicorn app.main:app --reload
uv run pytest
```
