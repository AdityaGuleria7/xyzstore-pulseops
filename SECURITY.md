# Security and public deployment

PulseOps is a portfolio application, not a production identity platform. Before making a live deployment public:

1. Set `PULSEOPS_ENV=production`.
2. Configure a unique `JWT_SECRET` of at least 32 characters.
3. Configure unique Admin/Packer emails and strong passwords.
4. Configure a reachable managed MongoDB using `MONGO_URL`; production disables the JSON fallback.
5. Keep secrets only in your hosting provider's environment-variable store.
6. Do not commit `.env`, database URLs, private keys, uploaded files, or tokens.
7. For inventory verification photos, use durable storage (for example a Render persistent disk mounted through `PULSEOPS_DATA_DIR`, or object storage).
8. For a real organization, replace demo authentication with a managed identity provider, MFA, session revocation, and a proper user database.

The repository intentionally keeps demo credentials only as development defaults for local testing. Production startup rejects the demo passwords and missing production configuration.


## Intellectual-property protection

Copyright © 2026 Aditya Guleria. The production frontend is built without source maps
and is minified for deployment. The UI also displays a persistent ownership
notice and uses noindex metadata to reduce accidental public indexing.

These measures deter casual copying; they **cannot make a browser-delivered
frontend impossible to inspect or reproduce**. Any sensitive business logic,
credentials, secrets, or license enforcement must remain server-side.

For stronger commercial protection, deploy this application as a controlled
SaaS service rather than distributing the source code.
