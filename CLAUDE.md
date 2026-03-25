# Dev Server

Use `./dev.sh` to manage the local dev server:

```bash
./dev.sh start    # kill any existing server, start fresh, wait for ready
./dev.sh stop     # kill the server and watcher
./dev.sh status   # check if running
./dev.sh restart  # stop then start
./dev.sh logs     # tail recent server logs
```

Logs and PIDs are stored in `.dev/` (gitignored). Always use `./dev.sh start` instead of `npm run dev` directly — it handles port conflicts, runs in the background, and auto-restarts on crash.

**Important:** Never use `/tmp` for logs or temp files — it surfaces unnecessary permission prompts. Always use `.dev/` within the project directory.

## Preview production build

```bash
npx astro preview --port 4322
```

## Known issues

- **File input dialogs are slow/broken in dev mode** (both Safari and Chrome). This is a Vite dev server issue, not browser-specific. File pickers work in production builds (with a slight delay in Arc). Use **visible native `<input type="file">`** (technique #1) — this works across Arc, Safari, and mobile Safari. Test page at `/file-test` has all 7 techniques for comparison.
