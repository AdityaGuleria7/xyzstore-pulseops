# Publish Checklist

- [ ] Replace all public deployment credentials with your own values in Render/Vercel environment settings.
- [ ] Confirm `.env` is ignored and no secrets are committed.
- [ ] Create a managed MongoDB database and set `MONGO_URL`.
- [ ] Set a strong `JWT_SECRET` (Render can generate one automatically).
- [ ] Set unique Admin and Packer emails/passwords.
- [ ] Keep `PULSEOPS_ENV=production`.
- [ ] Confirm `/api/health` returns OK after deployment.
- [ ] Test login, order label creation, Worker Mode scanning, staging, handover, receiving, Problem Log, Shift Report, CSV export, and Command Center search.
- [ ] Verify print and camera scanning on HTTPS.
- [ ] Decide how inventory verification photos will be persisted (Render disk or object storage).
- [ ] Add the final GitHub URL and live demo URL to the resume and LinkedIn.
