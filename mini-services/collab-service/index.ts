import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { Server } from 'socket.io'

// ---------- Types ----------

interface BoardUser {
  id: string
  name: string
  avatarColor: string
  role: string
}

interface PresenceEntry {
  user: BoardUser
}

// boardId -> Map(socketId -> PresenceEntry)
type PresenceMap = Map<string, Map<string, PresenceEntry>>
const presence: PresenceMap = new Map()

// Track which boards a socket has joined so we can clean up on disconnect.
// socketId -> Set<boardId>
const socketBoards: Map<string, Set<string>> = new Map()

// ---------- HTTP server (health endpoint added AFTER socket.io attaches) ----------

// We create the server with NO request listener here. After socket.io attaches
// (with path "/"), engine.io wraps ALL request handling (its `check()` returns
// true for every URL because path is "/"). To still serve /health, we capture
// the engine.io listener, remove it, and prepend our own dispatcher that
// short-circuits /health and falls through to engine.io otherwise.
const httpServer = createServer()

// ---------- Socket.io server ----------

const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Capture the engine.io request listener(s) that socket.io just installed.
const engineListeners = httpServer.listeners('request').slice(0)
httpServer.removeAllListeners('request')

httpServer.on('request', (req: IncomingMessage, res: ServerResponse) => {
  // Health endpoint (kept on a dedicated path so socket.io clients connecting
  // to "/" are not affected).
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/health/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        ok: true,
        service: 'boardly-collab',
        rooms: presence.size,
      }),
    )
    return
  }

  // Otherwise, defer to engine.io's listener chain (which handles WS upgrade
  // polling and rejects everything else with its own error response).
  for (const listener of engineListeners) {
    listener.call(httpServer, req, res)
  }
})

// ---------- Helpers ----------

const roomName = (boardId: string) => `board:${boardId}`

function broadcastPresence(boardId: string) {
  const boardPresence = presence.get(boardId)
  const users: BoardUser[] = boardPresence
    ? Array.from(boardPresence.values()).map((entry) => entry.user)
    : []
  io.to(roomName(boardId)).emit('presence:update', { boardId, users })
}

function removeSocketFromBoard(socketId: string, boardId: string) {
  const boardPresence = presence.get(boardId)
  if (!boardPresence) return
  boardPresence.delete(socketId)
  if (boardPresence.size === 0) {
    presence.delete(boardId)
  }
  broadcastPresence(boardId)
}

// ---------- Connection lifecycle ----------

io.on('connection', (socket) => {
  console.log(`[collab] socket connected: ${socket.id}`)
  socketBoards.set(socket.id, new Set())

  // ---- board:join ----
  socket.on(
    'board:join',
    (payload: {
      boardId: string
      user: { id: string; name: string; avatarColor: string }
      role: string
    }) => {
      const { boardId, user, role } = payload
      if (!boardId || !user) {
        console.warn(`[collab] board:join invalid payload from ${socket.id}`)
        return
      }

      const room = roomName(boardId)
      socket.join(room)

      // Track board membership for this socket (for disconnect cleanup).
      const boards = socketBoards.get(socket.id) ?? new Set<string>()
      boards.add(boardId)
      socketBoards.set(socket.id, boards)

      // Track presence.
      const boardPresence =
        presence.get(boardId) ?? new Map<string, PresenceEntry>()
      boardPresence.set(socket.id, {
        user: {
          id: user.id,
          name: user.name,
          avatarColor: user.avatarColor,
          role,
        },
      })
      presence.set(boardId, boardPresence)

      console.log(
        `[collab] join board=${boardId} socket=${socket.id} user=${user.name} role=${role} online=${boardPresence.size}`,
      )

      // Broadcast updated presence to everyone in the room (including newcomer).
      broadcastPresence(boardId)

      // Ask existing room members to send the current scene to the newcomer.
      socket.to(room).emit('scene:request', {
        boardId,
        fromSocketId: socket.id,
      })
    },
  )

  // ---- board:leave ----
  socket.on('board:leave', (payload: { boardId: string }) => {
    const { boardId } = payload
    if (!boardId) return

    const room = roomName(boardId)
    socket.leave(room)

    const boards = socketBoards.get(socket.id)
    if (boards) boards.delete(boardId)

    removeSocketFromBoard(socket.id, boardId)
    console.log(`[collab] leave board=${boardId} socket=${socket.id}`)
  })

  // ---- scene:sync ----
  socket.on(
    'scene:sync',
    (payload: { boardId: string; elements: any; appState?: any }) => {
      const { boardId, elements, appState } = payload
      if (!boardId) return
      socket.to(roomName(boardId)).emit('scene:update', {
        boardId,
        elements,
        appState,
      })
    },
  )

  // ---- scene:response ----
  socket.on(
    'scene:response',
    (payload: {
      boardId: string
      targetSocketId: string
      elements: any
      appState?: any
    }) => {
      const { boardId, targetSocketId, elements, appState } = payload
      if (!boardId || !targetSocketId) return
      io.to(targetSocketId).emit('scene:hydrate', {
        boardId,
        elements,
        appState,
      })
    },
  )

  // ---- cursor:move ----
  socket.on(
    'cursor:move',
    (payload: {
      boardId: string
      cursor: { x: number; y: number }
      user: { id: string; name: string; avatarColor: string }
    }) => {
      const { boardId, cursor, user } = payload
      if (!boardId) return
      socket.to(roomName(boardId)).emit('cursor:update', {
        boardId,
        cursor,
        user,
      })
    },
  )

  // ---- pointer:down ----
  socket.on(
    'pointer:down',
    (payload: { boardId: string; user: { id: string; name: string; avatarColor: string } }) => {
      const { boardId, user } = payload
      if (!boardId) return
      socket.to(roomName(boardId)).emit('pointer:down', { boardId, user })
    },
  )

  // ---- pointer:up ----
  socket.on(
    'pointer:up',
    (payload: { boardId: string; user: { id: string; name: string; avatarColor: string } }) => {
      const { boardId, user } = payload
      if (!boardId) return
      socket.to(roomName(boardId)).emit('pointer:up', { boardId, user })
    },
  )

  // ---- disconnect ----
  socket.on('disconnect', (reason) => {
    console.log(`[collab] socket disconnected: ${socket.id} reason=${reason}`)
    const boards = socketBoards.get(socket.id)
    if (boards) {
      for (const boardId of boards) {
        removeSocketFromBoard(socket.id, boardId)
      }
    }
    socketBoards.delete(socket.id)
  })

  socket.on('error', (err: unknown) => {
    console.error(`[collab] socket error (${socket.id}):`, err)
  })
})

// ---------- Start ----------

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[collab] Boardly collab service listening on port ${PORT}`)
  console.log(`[collab] health: http://localhost:${PORT}/health`)
})

// ---------- Graceful shutdown ----------

function shutdown(signal: string) {
  console.log(`[collab] received ${signal}, shutting down...`)
  // Close all connected sockets first so clients get a clean disconnect.
  io.close(() => {
    httpServer.close(() => {
      console.log('[collab] server closed')
      process.exit(0)
    })
  })

  // Force-exit if graceful close hangs.
  setTimeout(() => {
    console.warn('[collab] forcing exit after timeout')
    process.exit(1)
  }, 5000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
