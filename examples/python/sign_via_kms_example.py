#!/usr/bin/env python3
"""MOCKED KMS signing for TrustLedger ledger entries.

Demonstrates acquiring a *key handle* (ARN / resource name) from the
environment and calling a Sign-shaped API. Private key bytes are never
loaded, printed, or written.

  TRUSTLEDGER_KMS_MOCK=1 python3 examples/python/sign_via_kms_example.py

Set TRUSTLEDGER_KMS_MOCK=0 and install boto3 only when a human has provided
staging AWS credentials. This script still will not print key material.

Does not call TrustLedger production. Does not read TEST-KEYPAIR files.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
from typing import Any


def canonical_json(obj: Any) -> str:
    return json.dumps(obj, separators=(",", ":"), sort_keys=True, ensure_ascii=False)


def compute_hash(
    prev_hash: str | None,
    entity: Any,
    timestamp: str,
    actor_id: str,
) -> str:
    prev = b"" if prev_hash in (None, "") else str(prev_hash).encode("utf-8")
    data = (
        prev
        + canonical_json(entity).encode("utf-8")
        + timestamp.encode("utf-8")
        + actor_id.encode("utf-8")
    )
    return hashlib.sha256(data).hexdigest()


class MockKms:
    """Stand-in for boto3 KMS. Holds a handle only — no private key."""

    def __init__(self, key_id: str) -> None:
        self.key_id = key_id

    def sign(
        self,
        *,
        KeyId: str,
        Message: bytes,
        MessageType: str,
        SigningAlgorithm: str,
    ) -> dict[str, Any]:
        print("MOCK kms.sign")
        print("  KeyId (handle):", KeyId)
        print("  MessageType:", MessageType)
        print("  SigningAlgorithm:", SigningAlgorithm)
        print("  Message_utf8:", Message.decode("utf-8"))
        print("  (No private key in this process. Signature is not real.)")
        # Opaque placeholder — not ed25519. Callers must not persist this as a ledger signature.
        return {
            "KeyId": KeyId,
            "Signature": b"MOCK-KMS-SIGNATURE-NOT-FOR-PRODUCTION",
            "SigningAlgorithm": SigningAlgorithm,
        }


def acquire_kms_handle() -> tuple[str, Any]:
    """Return (key_id, client). The id is a handle (ARN / alias / resource name)."""
    key_id = os.environ.get("TRUSTLEDGER_KMS_KEY_ID", "alias/trustledger-ledger-TEST-ONLY")
    mock = os.environ.get("TRUSTLEDGER_KMS_MOCK", "1") != "0"
    provider = os.environ.get("TRUSTLEDGER_KMS_PROVIDER", "aws").lower()

    if mock:
        print("Using MOCK KMS client (TRUSTLEDGER_KMS_MOCK!=0).")
        if provider == "gcp":
            print(
                "GCP shape (not executed): cloudkms AsymmetricSign on",
                os.environ.get(
                    "TRUSTLEDGER_GCP_KEY_NAME",
                    "projects/PROJECT/locations/LOCATION/keyRings/RING/cryptoKeys/KEY/cryptoKeyVersions/1",
                ),
            )
        return key_id, MockKms(key_id)

    if provider == "gcp":
        print("GCP live path is not implemented in this example. Use MOCK or Cloud runbooks.")
        sys.exit(2)

    try:
        import boto3  # type: ignore
    except ImportError:
        print("boto3 not installed. pip install boto3 or keep TRUSTLEDGER_KMS_MOCK=1", file=sys.stderr)
        sys.exit(2)
    region = os.environ.get("AWS_REGION", "eu-west-1")
    print("Creating boto3 KMS client in", region, "for handle", key_id)
    return key_id, boto3.client("kms", region_name=region)


def fetch_public_key_url(base_url: str) -> str:
    return base_url.rstrip("/") + "/api/method/srm_core.api.ledger.public_key"


def main() -> int:
    parser = argparse.ArgumentParser(description="Mock KMS sign for ledger current_hash")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("BASE_URL", "https://YOUR-STAGING-HOST"),
        help="Placeholder BASE_URL for public_key curl (not called by default)",
    )
    args = parser.parse_args()

    entity = {
        "filename": "culvert_block_20260801.jpg",
        "gps_lat": -33.0002,
        "gps_lon": 25.7001,
        "id": "EVID-0099",
        "parent_id": "INSP-1001",
        "parent_type": "inspection",
        "timestamp": "2026-08-01T09:17:00Z",
        "uploader_id": "USER-INS-01",
    }
    current_hash = compute_hash(
        None,
        entity,
        "2026-08-01T09:17:30Z",
        "USER-INS-01",
    )
    print("current_hash:", current_hash)

    key_id, kms = acquire_kms_handle()
    resp = kms.sign(
        KeyId=key_id,
        Message=current_hash.encode("utf-8"),
        MessageType="RAW",
        SigningAlgorithm=os.environ.get("TRUSTLEDGER_KMS_ALG", "ED25519_SHA_512"),
    )
    sig_b64 = base64.b64encode(resp["Signature"]).decode("ascii")
    print("signature_b64 (MOCK placeholder unless live KMS):", sig_b64)
    print("Verify with public key only:")
    print("  curl -sS", fetch_public_key_url(args.base_url), '\\')
    print('    -H "Authorization: token ${API_KEY}"')
    print("Human security review required before production Sign.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
