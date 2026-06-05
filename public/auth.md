# auth.md

You are an agent. This site is a static, public, read-only deployment of the
PRISM benchmark. **Agentic registration is not supported.** There is no user
account, no API key, and no token to issue.

This file tells you what is available, what is not, and where to look next.

## What this site is

PRISM (Peer Review Intelligence via Structured Multi-dimensional assessment)
is a benchmark for evaluating LLM-generated and human peer reviews of machine
learning papers. The site publishes:

- The paper (read-only HTML at `/`).
- An interactive demo explorer (read-only HTML at `/demo`) backed by static
  JSON fixtures under `data_demo/`.
- A machine-readable capability descriptor at `/.well-known/agent-card.json`.
- A resource catalog at `/.well-known/api-catalog`.
- A documentation-only DNS-AID zone file at `/.well-known/dns-aid.zone`.

## Current state

This site does not support agentic registration. There is no `/agent/identity`
endpoint, no token endpoint, no revocation endpoint, and no claim ceremony.
Every URL on the site is publicly fetchable without credentials.

Do not attempt to register. Do not poll for a token. Do not expect a
`WWW-Authenticate: Bearer resource_metadata="..."` header on a 401 — the site
does not return 401, because there is nothing to gate.

## What you can do

1. **Read the capability descriptor.** `GET /.well-known/agent-card.json`
   returns the full A2A agent-card with the four benchmark capabilities
   (constructiveness, flaws, depth, novelty), their inputs, metrics, and links
   to the demo. This is the authoritative description of what the site offers.
2. **Browse the resource catalog.** `GET /.well-known/api-catalog` returns a
   JSON-LD `DataCatalog` of the public resources.
3. **Read the documentation-only DNS-AID zone file.**
   `GET /.well-known/dns-aid.zone` returns the zone file the maintainers
   intend to publish at a custom domain once one is registered. It is not
   authoritative on the current `prism-benchmark.github.io` host because the
   project does not own the `github.io` zone — the in-file comment block
   explains the migration path.
4. **Run the demo.** `GET /demo` returns the interactive read-only demo page.
   The JSON fixtures it loads are public.
5. **Cite the paper.** The arXiv link is in the capability descriptor.

## Discovery (for completeness)

The standard auth.md discovery documents are published but intentionally
empty, so an agent deciding whether to register gets a clean negative answer:

- `GET /.well-known/oauth-protected-resource` — RFC 9728 Protected Resource
  Metadata with an empty `authorization_servers` array, signalling that none
  of the public resources require authorization.
- `GET /.well-known/oauth-authorization-server` — RFC 8414 Authorization
  Server Metadata with an `agent_auth` block whose `identity_types_supported`
  and `credential_types_supported` arrays are empty, signalling that no
  registration surface is offered. `register_uri`, `claim_url`, and the
  `revocation_endpoint` are explicitly `null` (not applicable).

## Errors you may encounter

| Status                                             | Meaning                                                                         | What to do                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Any non-2xx on a public resource                   | The page or fixture is missing or has moved.                                    | Re-read the capability descriptor; do not retry the same URL. |
| `404` on `/.well-known/oauth-authorization-server` | The AS metadata is intentionally not published in some deployments (see above). | Treat the site as not offering agentic registration.          |
