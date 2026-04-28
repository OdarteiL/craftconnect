# CraftConnect — Fixes Log

## UI / Frontend

### FX-001 — Dark mode text invisible on light theme
**Files:** `ProfilePage.css`, `AdminPage.css`
**Fix:** Replaced all hardcoded dark hex colors (`#1a1a1a`, `#2a2a2a`, `#fff`, `#aaa`) with CSS variables (`var(--bg-card)`, `var(--text-primary)`, etc.)

### FX-002 — Homepage white background ignores theme toggle
**Files:** `index.css`
**Fix:** Replaced `.homepage { background: white }`, `.bg-light { background: #f8f9fa }`, `.product-card`, `.category-item`, `.auction-card` hardcoded whites with CSS variables.

### FX-003 — Auction bid input resets every 10 seconds
**Files:** `AuctionDetailPage.jsx`
**Fix:** Added `isInitial` flag to `fetchAuction` — `setBidAmount` only called on first load, not on polling interval.

### FX-004 — Logo appears small due to transparent padding
**Files:** `frontend/src/assets/CraftConnect.png`
**Fix:** Cropped transparent padding from PNG using PIL. Content was 428×358 inside a 500×500 canvas.

### FX-005 — Dummy products showing instead of real DB products
**Files:** `CatalogPage.jsx`
**Fix:** Removed `DUMMY_PRODUCTS` fallback. State initializes to `[]`, always uses real API data. Removed the `.catch()` that fell back to dummy data.

### FX-006 — Auction detail page shows "not found" after login redirect
**Files:** `AuctionDetailPage.jsx`, `LoginPage.jsx`
**Fix:** Login now reads `?redirect=` param and navigates back after auth. Detail page shows actual API error with "Back to Auctions" link.

### FX-007 — Dummy auction data (integer IDs) linked from AuctionsPage
**Files:** `AuctionsPage.jsx`
**Fix:** Removed `DUMMY_AUCTIONS` entirely. List starts empty, only shows real API data.

---

## Backend

### FX-008 — Payment transaction rollback on already-committed transaction
**Files:** `backend/src/routes/payments.js`
**Fix:** Moved `await t.commit()` to after Paystack initialization succeeds. Wrapped rollback in `try/catch` to prevent crash if transaction already finished.

### FX-009 — Payment route missing from server (old code running)
**Fix:** Server was running stale code. Ran `git pull origin develop` + `docker compose up --build -d backend` on Hetzner.

---

## Infrastructure / Deployment

### FX-010 — CORS blocking all API calls (wrong origin)
**Files:** `backend/src/index.js`, `.env` on server
**Fix:** Changed CORS to accept comma-separated origins. Set `CORS_ORIGIN=http://178.105.30.31,http://178.105.30.31:5173` on server. Browser was accessing on port 80, CORS was set to port 5173.

### FX-011 — `VITE_API_URL` hardcoded to localhost in docker-compose
**Files:** `docker-compose.yml`
**Fix:** Changed build arg from hardcoded `http://localhost:4000/api` to `${VITE_API_URL:-http://localhost:4000/api}` so server `.env` value is used.

### FX-012 — Frontend Docker build ignores `.env` file (uses ARG not file)
**Fix:** Added `VITE_API_URL=http://178.105.30.31:4000/api` to `/opt/craftconnect/.env` on server. Ran `docker compose build --no-cache frontend` to force fresh build with correct URL.

### FX-013 — Redis cache serving stale empty product responses
**Fix:** Ran `docker exec craftconnect-cache redis-cli FLUSHALL` to clear stale cache.

### FX-014 — CI/CD pipeline failing (uppercase repo name in image tags)
**Files:** `.github/workflows/ci-cd.yml`
**Fix:** Removed GHCR image build entirely. Simplified pipeline to: build check → SSH `git pull` + `docker compose up --build` on Hetzner.

### FX-015 — `FRONTEND_URL` missing port on server
**Fix:** `FRONTEND_URL` was `http://178.105.30.31` but frontend runs on `:5173`. Updated to include port, then later set CORS to accept both.

### FX-016 — Docker Compose `version` attribute warning
**Note:** `version: '3.8'` is obsolete in newer Docker Compose. Non-breaking warning only — not yet removed.
