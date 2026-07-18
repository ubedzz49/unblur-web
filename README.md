# unblur-web

The Unblur frontend (Next.js). Talks to the gateway, not to services directly.

See `.claude/skills/coding-standards/SKILL.md` for how this repo is expected to be worked on,
and `FRONTEND_DESIGN.md` in the docs folder for the design tokens and mobile rules this app
follows.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm test` — unit/component tests (Vitest)
- `npm run lint` — ESLint
