# SpendTrack landing page

Static landing page built with HTML, CSS, and JavaScript for GitHub Pages.

## Run locally
Open `index.html` in a browser, or from this folder run:
```bash
python -m http.server 8000
```
Then visit http://localhost:8000.

## Early access signup
`waitlist.js` sends a URL-encoded POST in a hidden iframe. The request includes `email`, `response=iframe`, and a unique `requestId`. The backend returns an HTML page that posts the same ID and an explicit `outcome` (`success`, `duplicate`, `invalid`, or `failure`) to the parent. The frontend validates the Apps Script origin and request ID. It does not require `event.source` to be the form's iframe: Apps Script HTML Service sandboxes pages in nested iframes, so the message can come from a nested frame. Requiring the exact form iframe as the source dropped the valid response and caused the timeout despite a successful sheet write. A timeout remains an unknown outcome.

The Apps Script code is provided in [apps-script/Code.gs](apps-script/Code.gs). Before using it, replace `PASTE_YOUR_EXISTING_SPREADSHEET_ID_HERE` with the ID of the current spreadsheet. Paste it into the existing Apps Script project, then update the existing Web App deployment to a new version. Keep the same deployment and spreadsheet; no new sheet or deployment is needed. The script preserves the `Email`, `Signup Date`, and `Status` columns and logs request IDs and outcomes without logging email addresses.

After deployment, use the Apps Script **Executions** page to correlate `requestId` with the `[SpendTrack Signup]` browser console logs. The hidden iframe's HTTP status and response headers are inaccessible to the parent page, so the site does not treat an opaque POST as success. The HTML response contains only the outcome, message, and correlation ID.

## Deploy
Push these files to a GitHub repository, enable GitHub Pages from the `main` branch and `/ (root)`, then configure the custom domain `spendtrack.in` in GitHub Pages and add the DNS records GitHub specifies at GoDaddy.
