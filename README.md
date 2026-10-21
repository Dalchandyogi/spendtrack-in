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

The Apps Script source is maintained in the existing Google Apps Script project and is not included in this repository. Update that project and deploy a new version of its existing Web App deployment, keeping the same deployment and spreadsheet.

After deployment, use the Apps Script **Executions** page to correlate `requestId` with the `[SpendTrack Signup]` browser console logs. The hidden iframe's HTTP status and response headers are inaccessible to the parent page, so the site does not treat an opaque POST as success. The HTML response contains only the outcome, message, and correlation ID.

## Deploy
Push these files to a GitHub repository, enable GitHub Pages from the `main` branch and `/ (root)`, then configure the custom domain `spendtrack.in` in GitHub Pages and add the DNS records GitHub specifies at GoDaddy.
