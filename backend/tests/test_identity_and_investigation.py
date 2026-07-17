from uuid import uuid4

from httpx import AsyncClient


async def test_can_open_case_for_identity_genome(client: AsyncClient) -> None:
    genome_response = await client.post(
        "/api/v1/identity-genomes", json={"owner_id": str(uuid4()), "display_name": "Aisha Shah"}
    )
    assert genome_response.status_code == 201

    investigation_response = await client.post(
        "/api/v1/investigations",
        json={
            "identity_genome_id": genome_response.json()["id"],
            "artifact_type": "email",
            "artifact_reference": "upload://fake-ceo-email.eml",
        },
    )

    assert investigation_response.status_code == 201
    body = investigation_response.json()
    assert body["status"] == "queued"
    assert body["verdict"] == "pending"
    assert body["case_number"].startswith("TDNA-")


async def test_not_found_uses_standard_error_contract(client: AsyncClient) -> None:
    response = await client.get(f"/api/v1/investigations/{uuid4()}")

    assert response.status_code == 404
    body = response.json()
    assert body["code"] == "INVESTIGATION_NOT_FOUND"
    assert body["request_id"] == response.headers["X-Request-ID"]
    assert body["details"]["id"]


async def test_plain_text_sample_builds_identity_profile(client: AsyncClient) -> None:
    genome_response = await client.post(
        "/api/v1/identity-genomes", json={"owner_id": str(uuid4()), "display_name": "Aisha Shah"}
    )
    genome_id = genome_response.json()["id"]

    response = await client.post(
        f"/api/v1/identity-genomes/{genome_id}/samples/text",
        json={
            "content": "My thoughtful product strategy is clear and practical.",
            "source_label": "bio",
        },
    )

    assert response.status_code == 201
    assert response.json()["sample_count"] == 1
    assert response.json()["embedding_count"] == 1
    assert response.json()["version"] == "v1"
    assert response.json()["features"]["greeting_style"] == "informal"
    versions = await client.get(f"/api/v1/identity-genomes/{genome_id}/versions")
    assert versions.status_code == 200
    assert versions.json()[0]["version"] == "v1"
    assert versions.json()[0]["source_label"] == "bio"
    assert versions.json()[0]["guardian_observation"]

    second_response = await client.post(
        f"/api/v1/identity-genomes/{genome_id}/samples/text",
        json={
            "content": "I build practical backend systems with clear product documentation.",
            "source_label": "portfolio",
        },
    )
    assert second_response.status_code == 201
    versions = await client.get(f"/api/v1/identity-genomes/{genome_id}/versions")
    assert versions.json()[1]["version"] == "v2"
    assert versions.json()[1]["source_label"] == "portfolio"
    assert versions.json()[1]["confidence_delta"] == 0.1
    assert versions.json()[1]["guardian_observation"]


async def test_text_investigation_returns_deterministic_cipher_verdict(client: AsyncClient) -> None:
    genome_response = await client.post(
        "/api/v1/identity-genomes", json={"owner_id": str(uuid4()), "display_name": "Aisha Shah"}
    )
    genome_id = genome_response.json()["id"]
    await client.post(
        f"/api/v1/identity-genomes/{genome_id}/samples/text",
        json={"content": "My thoughtful product strategy is clear and practical."},
    )
    case_response = await client.post(
        "/api/v1/investigations",
        json={
            "identity_genome_id": genome_id,
            "artifact_type": "plain_text",
            "artifact_reference": "judge://sample-email",
        },
    )

    response = await client.post(
        f"/api/v1/investigations/{case_response.json()['id']}/run-text",
        json={"content": "My thoughtful product strategy is clear and practical."},
    )

    assert response.status_code == 200
    assert response.json()["risk"]["verdict"] == "authentic"
    assert response.json()["agents"][0]["agent"] == "cipher"
    assert response.json()["risk"]["breakdown"]["writing"] > 0.5
    assert response.json()["certificate"]["certificate_number"].startswith("TDNA-")
    assert response.json()["investigation"]["lifecycle_state"] == "closed"
    assert response.json()["investigation"]["genome_version"] == "v1"
