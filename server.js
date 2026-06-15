import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Generate readable random codes
function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const CLEAN_DB = {
  setupComplete: false,
  auctioneerRegistered: false,
  auctioneerName: null,
  auctioneerCode: null,
  auctioneerId: null,
  auctioneerPassword: null,
  tournament: null,
  players: [],
  teams: [],
  auctionState: {
    activePlayerId: null,
    currentBid: 0,
    highestBidderId: null,
    status: 'idle',
    timeLeft: 0,
    bidHistory: []
  }
};

let db = { ...CLEAN_DB };

// Track socket authentication: socketId -> { role, teamId? }
const socketAuth = new Map();

function loadDb() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      db = JSON.parse(data);
    } catch (e) {
      db = { ...CLEAN_DB };
    }
  } else {
    persistDb(CLEAN_DB);
  }
}

// Write to file only
function persistDb(state) {
  db = state;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write db.json', e);
  }
}

// Save and broadcast
function saveDb(newDbState) {
  persistDb(newDbState);
  broadcastState();
}

// Strip sensitive fields for non-auctioneer clients
function sanitize(fullDb) {
  const { auctioneerCode, ...rest } = fullDb;
  return {
    ...rest,
    teams: (rest.teams || []).map(t => {
      const { loginId, loginPassword, ...team } = t;
      return team;
    })
  };
}

// Broadcast to all connected sockets based on their auth
function broadcastState() {
  const sanitized = sanitize(db);
  for (const [sid, socket] of io.sockets.sockets) {
    const auth = socketAuth.get(sid);
    if (auth && auth.role === 'auctioneer') {
      socket.emit('state-updated', db);
    } else {
      socket.emit('state-updated', sanitized);
    }
  }
}

// Guard: check if socket is authenticated as auctioneer
function isAuctioneer(socket) {
  const auth = socketAuth.get(socket.id);
  return auth && auth.role === 'auctioneer';
}

// Guard: check if socket is authenticated as a specific team
function getTeamAuth(socket) {
  const auth = socketAuth.get(socket.id);
  return auth && auth.role === 'team' ? auth.teamId : null;
}

loadDb();

let timerInterval = null;
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    if (db.auctionState.status === 'bidding' && db.auctionState.timeLeft > 0) {
      const nextTime = db.auctionState.timeLeft - 1;
      if (nextTime === 0) {
        stopTimer();
        if (db.auctionState.highestBidderId) executeDeclareSold();
        else executeDeclareUnsold();
      } else {
        db.auctionState.timeLeft = nextTime;
        broadcastState();
      }
    } else { stopTimer(); }
  }, 1000);
}

function executeDeclareSold() {
  const { activePlayerId, currentBid, highestBidderId } = db.auctionState;
  if (!activePlayerId || !highestBidderId) return;
  const winnerTeam = db.teams.find(t => t.id === highestBidderId);
  const soldPlayer = db.players.find(p => p.id === activePlayerId);
  if (!winnerTeam || !soldPlayer) return;

  db.players = db.players.map(p =>
    p.id === activePlayerId ? { ...p, status: 'sold', soldPrice: currentBid, soldToTeamId: highestBidderId } : p
  );
  db.teams = db.teams.map(t =>
    t.id === highestBidderId ? { ...t, budget: t.budget - currentBid, players: [...t.players, activePlayerId] } : t
  );
  db.auctionState.status = 'sold';
  db.auctionState.timeLeft = 0;
  saveDb(db);
}

function executeDeclareUnsold() {
  const { activePlayerId } = db.auctionState;
  if (!activePlayerId) return;
  db.players = db.players.map(p =>
    p.id === activePlayerId ? { ...p, status: 'unsold' } : p
  );
  db.auctionState.status = 'unsold';
  db.auctionState.timeLeft = 0;
  saveDb(db);
}

// ── Socket Handlers ──
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // Send sanitized state on connect (no auth yet)
  socket.emit('init-state', sanitize(db));

  // ── AUTH: Auctioneer login ──
  socket.on('auth-auctioneer', (authData) => {
    if (!db.setupComplete) {
      socket.emit('auth-error', 'No tournament created yet.');
      return;
    }
    
    // Support ID/Password login
    if (typeof authData === 'object' && authData !== null) {
      const { loginId, loginPassword } = authData;
      if (loginId === db.auctioneerId && loginPassword === db.auctioneerPassword) {
        socketAuth.set(socket.id, { role: 'auctioneer' });
        socket.emit('auth-success', { 
          role: 'auctioneer', 
          auctioneerId: db.auctioneerId, 
          auctioneerPassword: db.auctioneerPassword 
        });
        socket.emit('state-updated', db);
        return;
      }
      if (db.auctioneerCode && loginId === 'admin' && loginPassword === db.auctioneerCode) {
        socketAuth.set(socket.id, { role: 'auctioneer' });
        socket.emit('auth-success', { role: 'auctioneer', auctioneerCode: db.auctioneerCode });
        socket.emit('state-updated', db);
        return;
      }
      socket.emit('auth-error', 'Invalid Auctioneer ID or Password.');
      return;
    }
    
    // Support legacy code-only login
    if (authData === db.auctioneerCode) {
      socketAuth.set(socket.id, { role: 'auctioneer' });
      socket.emit('auth-success', { role: 'auctioneer', auctioneerCode: db.auctioneerCode });
      socket.emit('state-updated', db);
      return;
    }
    socket.emit('auth-error', 'Invalid auctioneer code.');
  });

  // ── AUTH: Team login with ID + password ──
  socket.on('auth-team', ({ loginId, loginPassword }) => {
    if (!db.setupComplete) {
      socket.emit('auth-error', 'No tournament created yet.');
      return;
    }
    const team = db.teams.find(t => t.loginId === loginId && t.loginPassword === loginPassword);
    if (!team) {
      socket.emit('auth-error', 'Invalid Team ID or Password.');
      return;
    }
    socketAuth.set(socket.id, { role: 'team', teamId: team.id });
    socket.emit('auth-success', { role: 'team', teamId: team.id, teamName: team.name });
    socket.emit('state-updated', sanitize(db));
  });

  // ── AUTH: Logout ──
  socket.on('logout', () => {
    socketAuth.delete(socket.id);
    socket.emit('logged-out');
  });

  // ── AUCTIONEER: Register auctioneer profile ──
  socket.on('register-auctioneer', (data) => {
    db.auctioneerId = data.auctioneerId;
    db.auctioneerPassword = data.auctioneerPassword;
    db.auctioneerName = data.auctioneerName;
    db.auctioneerRegistered = true;
    saveDb(db);
  });

  // ── AUCTIONEER: Setup tournament (creates auctioneer credentials & teams) ──
  socket.on('setup-tournament', (data) => {
    const auctioneerCode = 'AUC-' + generateCode(6);
    const auctioneerId = db.auctioneerId || data.auctioneerId || 'admin';
    const auctioneerPassword = db.auctioneerPassword || data.auctioneerPassword || generateCode(6);
    
    // Auto-generate credentials for pre-registered teams
    const teams = (data.teams || []).map(t => {
      const loginId = t.loginId || ('T-' + generateCode(4));
      const loginPassword = t.loginPassword || generateCode(6);
      const budget = Number(t.budget) || Number(data.startingBudget) || 80000000;
      return {
        id: 'team-' + Math.random().toString(36).substr(2, 9),
        name: t.name,
        captain: t.captain,
        budget,
        players: [],
        loginId,
        loginPassword
      };
    });

    const newDb = {
      ...db,
      setupComplete: true,
      auctioneerCode,
      auctioneerId,
      auctioneerPassword,
      tournament: {
        name: data.tournamentName,
        auctioneer: db.auctioneerName || data.auctioneerName || 'Master Auctioneer',
        gender: data.gender || 'Men',
        startingBudget: Number(data.startingBudget) || 80000000,
        minBidIncrement: Number(data.minBidIncrement) || 1000000,
        timerSeconds: Number(data.timerSeconds) || 30
      },
      teams,
      players: [],
      auctionState: { activePlayerId: null, currentBid: 0, highestBidderId: null, status: 'idle', timeLeft: 0, bidHistory: [] }
    };
    
    stopTimer();
    persistDb(newDb);
    
    // Auto-authenticate the creator as auctioneer
    socketAuth.set(socket.id, { role: 'auctioneer' });
    socket.emit('auth-success', { 
      role: 'auctioneer', 
      auctioneerId,
      auctioneerPassword
    });
    broadcastState();
  });

  // ── AUCTIONEER ONLY: Add team (generates login credentials) ──
  socket.on('add-team', (data) => {
    if (!isAuctioneer(socket)) { socket.emit('auth-error', 'Only auctioneer can add teams.'); return; }
    const loginId = 'T-' + generateCode(4);
    const loginPassword = generateCode(6);
    const budget = Number(data.budget) || (db.tournament ? db.tournament.startingBudget : 50000000);
    const newTeam = {
      id: 'team-' + Math.random().toString(36).substr(2, 9),
      name: data.name,
      captain: data.captain,
      budget,
      players: [],
      loginId,
      loginPassword
    };
    db.teams.push(newTeam);
    saveDb(db);
  });

  // ── AUCTIONEER ONLY: Delete team ──
  socket.on('delete-team', (teamId) => {
    if (!isAuctioneer(socket)) return;
    db.teams = db.teams.filter(t => t.id !== teamId);
    saveDb(db);
  });

  // ── Player self-registration (no auth needed) ──
  socket.on('register-player', (data) => {
    const newPlayer = {
      id: 'play-' + Math.random().toString(36).substr(2, 9),
      name: data.name,
      avatarUrl: data.avatarUrl || '',
      avatarPreset: data.avatarPreset || 'av-1',
      role: data.role,
      battingStyle: data.battingStyle,
      bowlingStyle: data.bowlingStyle,
      basePrice: 0,
      status: 'pending',
      soldPrice: 0,
      soldToTeamId: null
    };
    db.players.push(newPlayer);
    saveDb(db);
    socket.emit('player-register-success', newPlayer.id);
  });

  // ── AUCTIONEER ONLY: Approve player ──
  socket.on('approve-player', (data) => {
    if (!isAuctioneer(socket)) return;
    db.players = db.players.map(p =>
      p.id === data.playerId ? { ...p, basePrice: Number(data.basePrice), status: 'approved' } : p
    );
    saveDb(db);
  });

  // ── AUCTIONEER ONLY: Reject player ──
  socket.on('reject-player', (playerId) => {
    if (!isAuctioneer(socket)) return;
    db.players = db.players.filter(p => p.id !== playerId);
    saveDb(db);
  });

  // ── AUCTIONEER ONLY: Start auction for player ──
  socket.on('start-auction-player', (playerId) => {
    if (!isAuctioneer(socket)) return;
    const player = db.players.find(p => p.id === playerId);
    if (!player) return;
    stopTimer();
    db.players = db.players.map(p => {
      if (p.id === playerId) return { ...p, status: 'active' };
      if (p.status === 'active') return { ...p, status: 'approved' };
      return p;
    });
    db.auctionState = {
      activePlayerId: playerId,
      currentBid: player.basePrice || 0,
      highestBidderId: null,
      status: 'bidding',
      timeLeft: db.tournament ? db.tournament.timerSeconds : 30,
      bidHistory: []
    };
    saveDb(db);
    startTimer();
  });

  // ── TEAM ONLY: Place bid (secured — only authenticated team sockets) ──
  socket.on('place-bid', () => {
    const teamId = getTeamAuth(socket);
    if (!teamId) {
      socket.emit('bid-error', 'Authentication required to bid.');
      return;
    }
    const { activePlayerId, currentBid, highestBidderId, status } = db.auctionState;
    if (status !== 'bidding') return;
    const player = db.players.find(p => p.id === activePlayerId);
    const team = db.teams.find(t => t.id === teamId);
    if (!player || !team) return;

    const increment = db.tournament ? db.tournament.minBidIncrement : 50000;
    const nextBid = highestBidderId ? (currentBid + increment) : currentBid;

    if (team.budget < nextBid) { socket.emit('bid-error', 'Insufficient budget!'); return; }
    if (highestBidderId === teamId) { socket.emit('bid-error', 'You already hold the highest bid!'); return; }

    db.auctionState.currentBid = nextBid;
    db.auctionState.highestBidderId = teamId;
    db.auctionState.timeLeft = db.tournament ? db.tournament.timerSeconds : 30;
    db.auctionState.bidHistory.unshift({
      teamId, teamName: team.name, captain: team.captain, bidAmount: nextBid, timestamp: Date.now()
    });
    saveDb(db);
    startTimer();
  });

  // ── AUCTIONEER ONLY: Declare Sold / Unsold / Toggle Timer ──
  socket.on('declare-sold', () => { if (!isAuctioneer(socket)) return; stopTimer(); executeDeclareSold(); });
  socket.on('declare-unsold', () => { if (!isAuctioneer(socket)) return; stopTimer(); executeDeclareUnsold(); });
  socket.on('toggle-timer', () => {
    if (!isAuctioneer(socket)) return;
    if (db.auctionState.status === 'bidding') {
      stopTimer(); db.auctionState.status = 'paused'; saveDb(db);
    } else if (db.auctionState.status === 'paused') {
      db.auctionState.status = 'bidding'; saveDb(db); startTimer();
    }
  });

  // ── TEAM/AUCTIONEER: Toggle Player Playing 11 status ──
  socket.on('toggle-playing11', ({ playerId }) => {
    const teamId = getTeamAuth(socket);
    const isAuthAuctioneer = isAuctioneer(socket);
    
    const player = db.players.find(p => p.id === playerId);
    if (!player) {
      socket.emit('bid-error', 'Player not found.');
      return;
    }
    
    if (player.status !== 'sold') {
      socket.emit('bid-error', 'Only sold players can be selected for the Playing XI.');
      return;
    }

    if (!isAuthAuctioneer && player.soldToTeamId !== teamId) {
      socket.emit('bid-error', 'You can only manage your own squad roster.');
      return;
    }

    const squadTeamId = player.soldToTeamId;
    const currentPlaying11Count = db.players.filter(p => p.soldToTeamId === squadTeamId && p.isPlaying11).length;

    if (!player.isPlaying11 && currentPlaying11Count >= 11) {
      socket.emit('bid-error', 'Roster Limit Exceeded! A playing XI can have at most 11 players.');
      return;
    }

    player.isPlaying11 = !player.isPlaying11;
    saveDb(db);
  });

  // ── Reset DB ──
  socket.on('reset-db', () => {
    stopTimer();
    socketAuth.clear();
    saveDb({ ...CLEAN_DB });
  });

  socket.on('disconnect', () => {
    socketAuth.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

// Serve static files from the React app dist folder if it exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*all', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('Serving production build from static files.');
} else {
  console.log('Static dist directory not found. Server running in API-only mode.');
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
