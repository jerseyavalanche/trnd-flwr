# Oracle Cloud Always Free Notes

Preferred target: Ampere A1 ARM64 instance (Always Free tier).

## ARM64 compatibility
- Use Node 20+ ARM64 builds.
- Keep dependencies pure JS where possible (this repo currently uses JS/TS-only runtime deps).
- Avoid heavy native compile dependencies unless necessary.

## Resource posture
- Keep one backend process + one static frontend server.
- Run scanner on schedule, not continuously high-frequency.
- Keep SSE interval at 60s.

## Cost guardrails
- Use Always Free resources only.
- Do not attach paid managed model APIs by default.
- Keep OpenRouter/Ollama integrations optional and disabled by default.
