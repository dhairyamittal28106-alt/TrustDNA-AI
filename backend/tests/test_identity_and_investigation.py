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
