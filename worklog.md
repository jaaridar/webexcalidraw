# Boardly — Collaborative Excalidraw SaaS — Work Log

Project: A permission-first collaborative whiteboard platform built around Excalidraw.
Single user-visible route: `/` (dashboard + board view + control center via query params).
Mini-service: websocket collab on port 3003.

---
Task ID: 0
Agent: Orchestrator
Task: Project setup, dependency install, schema, foundation

Work Log:
- Explored existing Next.js 16 scaffold (shadcn/ui new-york, Tailwind 4, Prisma SQLite, NextAuth available).
- Installed: excalidraw@0.6.4, socket.io@4.8.3, socket.io-client@4.8.3, bcryptjs@3.0.3.
- Planning architecture: lightweight cookie-based session auth, Prisma models (User, Board, Collaborator), REST API routes, websocket collab mini-service.
- Brand: "Boardly", emerald accent palette (no indigo/blue), premium SaaS aesthetic.

Stage Summary:
- Foundation ready for schema + lib + API + frontend build.

---
Task ID: 5
Agent: websocket-collab-service
Task: Build websocket collab mini-service on port 3003

Work Log:
- Read worklog.md and reviewed examples/websocket/server.ts to understand existing reference implementation and Caddyfile forwarding rules.
- Created new independent bun project at mini-services/collab-service/ with package.json (type: module, dependency socket.io@^4.8.3, dev script `bun --hot index.ts`).
- Wrote index.ts implementing the full collaboration protocol:
  * Socket.io server with path '/', cors "*", pingTimeout 60000, pingInterval 25000, listening on hardcoded port 3003.
  * Client→Server events: board:join, board:leave, scene:sync, scene:response, cursor:move, pointer:down, pointer:up.
  * Server→Client events: presence:update, scene:update, scene:hydrate, scene:request, cursor:update, pointer:down, pointer:up.
  * In-memory presence: Map<boardId, Map<socketId, PresenceEntry>> plus socketBoards index for O(1) disconnect cleanup.
  * board:join joins socket to room `board:<boardId>`, tracks presence, broadcasts presence:update, emits scene:request to others.
  * scene:response routes a single scene payload to a specific targetSocketId via io.to(targetSocketId).emit('scene:hydrate', ...).
  * disconnect removes the socket from every board it had joined and rebroadcasts presence:update for each affected board.
  * SIGTERM/SIGINT graceful shutdown via io.close() + httpServer.close() with a 5s force-exit watchdog.
  * Console logging for connect/disconnect/join/leave.
- Discovered that with socket.io `path: '/'`, engine.io's `check(req)` returns true for EVERY URL (since every URL starts with '/'), so a naive createServer handler for /health is never invoked. Worked around this by capturing the engine.io request listener that socket.io installs, removing it, and prepending a dispatcher that short-circuits GET /health and falls through to engine.io for everything else.
- Ran `bun install` (socket.io@4.8.3, 22 packages installed).
- Started service in background: `bun --hot index.ts > /home/z/my-project/collab-service.log 2>&1 &`.
- Verified /health returns {"ok":true,"service":"boardly-collab","rooms":0}.
- Wrote and ran an end-to-end integration test using socket.io-client (two clients, Alice + Bob) verifying all 8 protocol flows: presence after join (1 user), presence after second join (2 users), scene:request relayed to existing member, scene:hydrate delivered to newcomer via scene:response, cursor:update broadcast, pointer:down broadcast, scene:update broadcast via scene:sync, and presence after leave (1 user). All 8 tests PASSED.

Stage Summary:
- Files created:
  * /home/z/my-project/mini-services/collab-service/package.json
  * /home/z/my-project/mini-services/collab-service/index.ts
  * /home/z/my-project/mini-services/collab-service/bun.lock (via bun install)
  * /home/z/my-project/mini-services/collab-service/node_modules/ (socket.io + engine.io + deps)
- Service running on port 3003 (PID verified, `bun --hot index.ts`).
- Health endpoint: GET http://localhost:3003/health → {"ok":true,"service":"boardly-collab","rooms":<n>}
- Log file: /home/z/my-project/collab-service.log
- All collaboration protocol events implemented and verified end-to-end with a two-client integration test. Mini-service is ready for the Next.js frontend to connect via `io("/?XTransformPort=3003")` through the Caddy gateway.

---
Task ID: 1-4,6-13
Agent: Orchestrator
Task: Build complete Boardly SaaS (lib, API, frontend, verification)

Work Log:
- Prisma schema: User, Board (visibility/accessMode/shareMode/password/restrictions/category/archive/favorite/thumbnail/elements), Collaborator. Pushed to SQLite.
- Lib: constants (roles/visibility/modes/categories/avatar colors), auth (cookie session + board-unlock cookie), boards (evaluateAccess permission engine + serializers), excalidraw-to-svg (live thumbnail renderer), demo-scenes (6 programmatic Excalidraw scenes), typed API client (api.ts), Zustand store (user + guest identity).
- API routes: auth (session GET/POST with server-side demo seeding, profile PATCH, signout POST), boards (list/create, GET/PATCH/DELETE, scene, access GET+verify-password, collaborators CRUD, duplicate, save), seed.
- Frontend: emerald premium theme (globals.css), layout + Providers (theme + react-query), app-shell (auth bootstrap + query-param routing), Dashboard (header, stats, search/filter/sort, board grid, profile menu, create dialog, rename dialog), BoardCard (live thumbnail, hover quick-open, favorite, ⋮ menu, delete confirm), CreateBoardDialog (title/desc/category + Private/Public + access level + share mode + password), ControlCenter sheet (8 sections: details, share link, visibility, access level, share mode, password, collaborators invite/role/revoke, restrictions), ExcalidrawCanvas (dynamic Excalidraw + socket.io real-time presence/scene-sync + debounced save + live thumbnail regen), BoardView (access gate: denied / password / guest-name / ready + header with presence + role badge + control center).
- Critical bug fixed: api.ts `json<T>()` factory (was calling json with no args, breaking all non-auth API calls → empty dashboard).
- Fixed app-shell to not auto-provision on shared board links (guests stayed guests).
- Fixed sign-out to use server endpoint (httpOnly cookie can't be cleared client-side).

Verification (Agent Browser, via Caddy gateway on :81):
- Dashboard renders 7 boards with live SVG thumbnails, stats (6/4/2/3/0), visibility/security badges, search & filters. Screenshot captured.
- Opening a board loads Excalidraw with the scene + "Control center" button (owner).
- Control Center opens with all 8 permission sections.
- Guest flow (separate session, no cookie): "Join the board" name gate → enters as Editor (editable board) or Viewer (read-only board).
- Real-time presence: owner + guest both show "2 live" via websocket collab service (rooms:1).
- Password-protected board: "Password required" gate → unlock with "boardly" → opens as Editor.
- Invite-only board: "This board is invite-only" denied screen.
- Create board flow: title + Public → creates (POST 201) → opens editor (7 boards total).
- Lint: 0 errors.

Environment note: The Next.js 16 + Turbopack dev server with the large @excalidraw/excalidraw bundle is memory-heavy; on this 4GB sandbox it can be OOM-killed during cold compilation (~16s first compile). An auto-restart wrapper (start-dev.sh) keeps it recovering. Both the Next dev server (port 3000) and the collab websocket service (port 3003) are running.

Stage Summary:
- Complete, production-style Boardly SaaS delivered: permission-first Excalidraw boards, owner dashboard with live thumbnails, full Board Control Center, real-time collaboration, and secure viewer/editor access via share links.
- All core PRD flows verified end-to-end in the browser.

---
Task ID: 14
Agent: Orchestrator
Task: Full rebuild & redesign — board-first, modular, premium SaaS

Work Log:
- Rebuilt entire frontend with clean modular architecture:
  * src/lib/types.ts — central type definitions (single source of truth)
  * src/lib/store.ts — Zustand (currentBoardId, sidebarCollapsed, user, guest)
  * src/lib/api.ts — auto-recovering API client (cleaned, typed)
  * src/hooks/use-data.ts — all React Query hooks (queries + mutations)
  * src/components/common.tsx — Logo, Avatar, AvatarStack, VisibilityPill, AccessPill, MiniBadges
  * src/components/sidebar.tsx — minimal board switcher (thumbnail + title only, collapsible 56px rail)
  * src/components/topbar.tsx — board control surface (features on top: visibility pill, favorite, presence, share, control, profile)
  * src/components/board-view.tsx — composes access gate → topbar + canvas
  * src/components/board-canvas.tsx — Excalidraw + socket.io real-time collab
  * src/components/access-gates.tsx — DeniedGate, PasswordGate, GuestNameGate
  * src/components/control-center.tsx — redesigned permission panel (8 sections)
  * src/components/create-board.tsx — minimal create dialog (title + visibility)
  * src/components/app-shell.tsx — board-first routing (opens most recent board)
- Deleted old: dashboard.tsx, board-card.tsx, control-center.tsx (old), create-board-dialog.tsx, board-view.tsx (old), excalidraw-canvas.tsx, boardly/*
- Refined premium design system (globals.css): sophisticated emerald-on-neutrals, glass header, soft shadows, thin scrollbars
- UX change (per user request): board-first, not dashboard-grid. Opens directly into a board. Sidebar = minimal switcher (thumbnail + title). All metadata (visibility, favorite, collaborators, password, access) lives in the TopBar (compact pills) + Control Center (full panel). Nothing clutters the default view.

Verification (Agent Browser):
- Board-first: app opens directly into most recent board (?b= auto-set). Sidebar + TopBar + Excalidraw. Zero errors.
- Switch boards via sidebar (7 items, minimal). Works.
- Create board: minimal dialog → opens Excalidraw. Works. 0 errors, 0 401s.
- Control Center: 8 sections render. Works.
- Favorite toggle: updates sidebar favorites section. Works.
- Sidebar collapse: 240px → 56px rail. Works.
- Lint: 0 errors.

Stage Summary:
- Complete rebuild delivered: board-first, modular, premium. ~12 focused component files, centralized types/hooks/store. Any developer can navigate it easily.
