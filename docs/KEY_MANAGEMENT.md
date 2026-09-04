# Ledger key management (TrustLedger)

**Status:** for human security review. Do not roll out production signing until this document is signed off.

This is the operational companion to `docs/LEDGER_API.md`. Production signs `UTF-8(ascii hex of current_hash)` with **ed25519**. Verifiers use only the **public** key from `GET /api/method/srm_core.api.ledger.public_key`.

## Why private keys must not be in the repo

| Risk | What happens |
|------|----------------|
| Git history | A leaked seed is forever in clones, forks, CI caches, and backups |
| Frontend bundle | Anything in `src/` can ship to browsers |
| CI logs | Accidental `print(private_key)` lands in GitHub Actions artefacts |
| Demo confusion | A TEST key used live makes every “verified” seal meaningless |

**Never commit:** PKCS8/PEM private keys, raw 32-byte seeds, hex seeds, AWS/GCP secret keys, or derivable passphrases that mint the Cloud signing key.

**Do commit:** this document, public keys used in **TEST-ONLY** fixtures (already in `tests/ledger_vectors/test_vectors.json`), and mock KMS examples that never persist a private key.

The frontend (`AuditTrailViewer`) verifies with the published public key only.

## Demo / test keys (ZIP only)

Illustrative import packs may include a throwaway keypair so `--create-ledger` can sign **offline**. That material is **not** a Cloud KMS key.

| Rule | Detail |
|------|--------|
| Location | Inside the demo ZIP only: `TEST-KEYPAIR-DO-NOT-USE-IN-PROD/` |
| Files | `README.md` (warning), `ed25519_public_key.b64`, private file named `*.TEST-ONLY.b64` |
| Git | **Do not** merge a PR that adds the private file to the repository. ZIP handoff is enough. If a private file was committed, treat it as burned: do not use it on Cloud; rotate; history cleanup is a human ops decision |
| Runtime examples | `examples/python/canonicalize_hash_sign.py` generates an **ephemeral** pair, prints the public key, signs once, **discards** the private key (not written to disk) |
| Production | Ignore every TEST key. Cloud signs with KMS/HSM. Omit `signature` on `create_entry` so the server signs |

`--create-ledger` against staging must use a **scoped staging** API key supplied by a human, never a production token, and never the ZIP test private key as the Cloud `public_key`.

## Production signing (KMS / HSM)

1. Create an ed25519 (or Cloud-approved asymmetric) key in AWS KMS or Google Cloud KMS. Private material never leaves the HSM.
2. Grant `srm-core` (or the import signer role) `kms:Sign` / Cloud KMS `cryptoKeyVersions.useToSign` only. No `GetPrivateKey`.
3. Publish **only** `kid` + raw 32-byte public key (standard Base64) on `ledger.public_key`.
4. Sign the **UTF-8 bytes of the 64-char hex** `current_hash` (`docs/LEDGER_API.md` §6). Do not sign the raw 32-byte SHA-256 digest.
5. Store `kid` on each ledger row so verifiers can select historical keys after rotation.

Mock integration (no network, no secrets): `examples/python/sign_via_kms_example.py`.

### AWS KMS (shape — mocked in-repo)

```python
import boto3  # production only; example script defaults to a mock client

kms = boto3.client("kms", region_name=os.environ["AWS_REGION"])
key_id = os.environ["TRUSTLEDGER_KMS_KEY_ID"]  # key ARN or alias — a handle, not a private key
resp = kms.sign(
    KeyId=key_id,
    Message=current_hash_hex.encode("utf-8"),
    MessageType="RAW",
    SigningAlgorithm="ED25519_SHA_512",  # confirm algorithm id with AWS for your key spec
)
signature_b64 = base64.b64encode(resp["Signature"]).decode("ascii")
```

Confirm the `SigningAlgorithm` string with AWS for the key spec you create. If the account cannot yet Sign ed25519, do **not** silently switch the ledger to ECDSA — that is a breaking change and needs a spec revision.

Verify with the public key endpoint (no private key):

```bash
curl -sS "${BASE_URL}/api/method/srm_core.api.ledger.public_key" \
  -H "Authorization: token ${API_KEY}"
```

The browser and import verifier decode `message.public_key` (Base64, 32 raw bytes) and verify the signature over `UTF-8(current_hash_hex)`.

### Google Cloud KMS (shape — mock)

```python
# Production: google.cloud.kms_v1 AsymmetricSign
# name = projects/.../cryptoKeyVersions/1   ← handle only
# digest or data = UTF-8(current_hash_hex) per LEDGER_API.md
# Never download the private key. Publish the public key via ledger.public_key.
```

The in-repo example prints this call shape when `TRUSTLEDGER_KMS_PROVIDER=gcp`. It does not ship GCP credentials.

## Rotation and audit checklist

**Rotate**

- [ ] Create a new KMS key version / key; new `kid`
- [ ] Dual-publish: `public_key?kid=` serves old and new until chains that used the old `kid` no longer need client verify (or keep old keys readable forever)
- [ ] Point `srm-core` Sign to the new key; do not delete old public keys while historical rows exist
- [ ] Disable (do not destroy) the old key until legal/retention says otherwise
- [ ] Record rotation in ops notes (date, `kid` old → new, operator). No key material in tickets

**Audit signature use**

- [ ] CloudTrail / Cloud Audit Logs: `Sign` / `AsymmetricSign` only from the `srm-core` role
- [ ] Alert on `Decrypt`, `GetPublicKey` from unexpected principals is fine; alert on any attempt to export private material
- [ ] Ledger rows include `kid`; spot-check `verify_entry` after deploy
- [ ] TEST-ONLY fixtures (`verify_fixture_test_only`) never configured as the live `public_key`
- [ ] No private key in git, Docker images, Vercel env, or browser bundles

**Human sign-off (required before production)**

- [ ] Security reviewer: KMS key spec, IAM, and this document
- [ ] `srm-core` owner: method names and server-side Sign
- [ ] Do not merge PRs that add a private key file to git (including TEST-ONLY private files)

## Related

| Doc / code | Role |
|------------|------|
| `docs/LEDGER_API.md` | Hash, canonical JSON, endpoints |
| `examples/python/canonicalize_hash_sign.py` | Ephemeral TEST sign/verify |
| `examples/python/sign_via_kms_example.py` | Mock KMS handle + Sign call shape |
| `tools/demo/api-examples/` | Postman/curl placeholders (`BASE_URL`, `API_KEY`) |
