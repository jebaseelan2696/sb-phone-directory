# Deployment Guide — SB Phone Directory

## 1. Set up the Google Sheet

Follow `SHEET_TEMPLATE.md` to create the `Directory`, `Lookups`, and `Meta` tabs.

## 2. Set up Apps Script

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Delete the default empty `Code.gs` content.
3. Create four files matching the ones in this repo's `backend/` folder:
   `Code.gs`, `Config.gs`, `DirectoryService.gs`, and update the manifest
   (`Project Settings → Show "appsscript.json"`) to match `backend/appsscript.json`.
4. Copy-paste each file's content from this repo into the matching Apps Script file.
5. In `Config.gs`, set `SHEET_ID` to your Sheet's ID (from its URL).

## 3. Install the auto-timestamp trigger (optional but recommended)

1. In the Apps Script editor, left sidebar → **Triggers** (clock icon).
2. **Add Trigger**:
   - Function: `onEditDirectory`
   - Deployment: Head
   - Event source: From spreadsheet
   - Event type: On edit
3. Save. Authorize when prompted (first time only).

This makes the `Updated At` column auto-fill whenever a row is edited.

## 4. Deploy as a Web App

1. **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Click **Deploy**, authorize the requested permissions.
6. Copy the **Web app URL** (ends in `/exec`).

## 5. Test the API

Paste the `/exec` URL directly into a browser, appending `?action=ping`:

```
https://script.google.com/macros/s/XXXXXXXX/exec?action=ping
```

You should see a JSON response with `"status":"success"`. Then test:

```
https://script.google.com/macros/s/XXXXXXXX/exec?action=directory
```

You should see the full contacts list as JSON.

## 6. Connect the frontend

1. Open `js/config.js` in this repo.
2. Paste the `/exec` URL into `API_BASE_URL`.
3. Commit and push.

## 7. Host on GitHub Pages

1. Push this repo to GitHub.
2. Repo → **Settings → Pages** → Source: **Deploy from branch** → Branch: `main` / root.
3. Wait a minute, then open the given `github.io` URL.

## Updating later

- **Sheet data**: just edit the Sheet. Changes appear within ~10 minutes (cache TTL), or
  immediately after `action=ping`/`directory` cache expiry. To force-refresh sooner, use
  the app's manual "Refresh" button (clears the local cache and re-fetches).
- **Backend code changes**: In Apps Script, **Deploy → Manage deployments → Edit (pencil)
  → New version → Deploy**. This keeps the same `/exec` URL — do NOT create a brand-new
  deployment, or the frontend's `API_BASE_URL` will break.
- **Frontend changes**: just `git push` — GitHub Pages redeploys automatically.
