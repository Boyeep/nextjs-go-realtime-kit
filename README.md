# Next.js + Go Realtime Kit

Full-stack starter for realtime rooms with a concurrency-safe Go hub and a
responsive Next.js client.

## Included

- WebSocket room isolation and fan-out
- live presence counts and typing events
- bounded client send buffers
- automatic browser reconnect
- normal HTTP room status endpoint
- auth/dashboard foundation inherited from the monorepo starter
- backend tests, frontend checks, Docker Compose, and CI

Run `npm run dev`, then open `http://127.0.0.1:3000/realtime`. Run
`npm run check` for the complete frontend and backend quality gate.
