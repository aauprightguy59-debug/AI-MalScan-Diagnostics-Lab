<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/25018543-3284-492e-9381-4a643b1317eb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Permanent test deployment

The repository includes a Render blueprint in `render.yaml` for a persistent public test service.

1. Open [Render Blueprints](https://dashboard.render.com/blueprints) and choose this repository.
2. Set the Blueprint Name to `ai-malscan-diagnostics-lab`.
3. Leave the branch as `main` and the blueprint path as `render.yaml`.
4. Add `GEMINI_API_KEY` in Render's environment variable form, then apply the blueprint.
5. Give the lab technician the `.onrender.com` URL shown on the service page.

The service uses the `PORT` supplied by Render, stores SQLite data on a persistent disk, and reports health at `/api/health`. The Codespaces URL is only a temporary development preview.
