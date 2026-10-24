# Qwen Chat

A minimal Next.js chatbot that calls an OpenAI-compatible Ollama endpoint through a server-side API route. The browser never receives the model endpoint configuration or API key.

## Requirements

- Node.js 20.9+
- npm
- A reachable Ollama-compatible endpoint that implements `POST /v1/chat/completions`

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and confirm the values. Keep this file private.

   ```env
   OLLAMA_BASE_URL=https://your-running-endpoint.example/v1
   OLLAMA_MODEL=qwen3.8-27b-uncensored-mtp
   OLLAMA_API_KEY=ollama
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Set the environment variables in **Project Settings → Environment Variables**:
   - `OLLAMA_BASE_URL` = your endpoint base URL ending in `/v1`
   - `OLLAMA_MODEL` = the exact model identifier accepted by your server
   - `OLLAMA_API_KEY` = `ollama` if the endpoint ignores API keys, otherwise the key your server requires
3. Deploy or redeploy after changing environment variables.

## Troubleshooting

- **502 from /api/chat:** the upstream tunnel may be offline, the model may still be loading, or the endpoint may return an error.
- **404:** check that `OLLAMA_BASE_URL` ends in `/v1`, and that `/v1/chat/completions` exists.
- **Model not found:** query `GET /v1/models` on your endpoint and use the exact model ID returned by it.
- **Slow responses:** Kaggle notebook sessions and temporary tunnels are not reliable production hosting. Use a persistent server or managed inference endpoint for public deployment.

## Security notes

- Do not put model credentials in frontend code or in any `NEXT_PUBLIC_*` variable.
- A public Cloudflare Quick Tunnel URL is accessible to anyone who knows it and may change or stop working. Do not use an unprotected notebook tunnel for a public production chatbot. Add authentication, rate limiting, and usage limits before sharing the site widely.
- The chat API validates message roles and length, but this starter does not include user accounts, persistent history, or rate limiting.
