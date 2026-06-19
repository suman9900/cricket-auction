import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// SVG Avatars preloaded
export const PRESET_AVATARS = [
  { id: 'av-1', name: 'Golden Helmet', svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#ffd700" stroke-width="2"/><path d="M30 40 L70 40 L75 55 L25 55 Z" fill="#ffd700"/><rect x="40" y="55" width="20" height="20" fill="#f59e0b"/><circle cx="38" cy="48" r="4" fill="#0f172a"/><circle cx="62" cy="48" r="4" fill="#0f172a"/><path d="M45 25 H55 V40 H45 Z" fill="#ffd700"/><path d="M25 50 C25 65 35 75 50 75 C65 75 75 65 75 50" fill="none" stroke="#ffd700" stroke-width="3"/></svg>' },
  { id: 'av-2', name: 'Fiery Batsman', svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#ff3366" stroke-width="2"/><circle cx="50" cy="42" r="18" fill="#e2e8f0"/><path d="M30 75 C30 60 40 55 50 55 C60 55 70 60 70 75 Z" fill="#ff3366"/><rect x="45" y="65" width="10" height="25" fill="#ffd700" transform="rotate(45 50 75)"/><path d="M42 38 Q50 30 58 38" fill="none" stroke="#0f172a" stroke-width="2"/></svg>' },
  { id: 'av-3', name: 'Spin Wizard', svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#0b1329" stroke="#00e5ff" stroke-width="2"/><circle cx="50" cy="40" r="15" fill="#cbd5e1"/><path d="M25 72 C25 60 35 55 50 55 C65 55 75 60 75 72 Z" fill="#00e5ff"/><circle cx="50" cy="70" r="10" fill="#00e676" stroke="#fff" stroke-dasharray="3,3"/><path d="M40 38 Q50 45 60 38" fill="none" stroke="#0f172a" stroke-width="2"/></svg>' },
  { id: 'av-4', name: 'Fast Bowler', svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#00e676" stroke-width="2"/><circle cx="50" cy="38" r="15" fill="#f1f5f9"/><path d="M28 75 C28 62 38 55 50 55 C62 55 72 62 72 75 Z" fill="#00e676"/><circle cx="70" cy="35" r="8" fill="#ff3366" stroke="#fff"/><path d="M42 35 L45 42 L55 35" fill="none" stroke="#0f172a" stroke-width="2"/></svg>' },
  { id: 'av-5', name: 'Cool Captain', svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#111827" stroke="#ffd700" stroke-width="2"/><circle cx="50" cy="40" r="16" fill="#f3f4f6"/><path d="M26 74 C26 62 36 56 50 56 C64 56 74 62 74 74 Z" fill="#3b82f6"/><path d="M38 30 L62 30 L58 20 L42 20 Z" fill="#1e3a8a"/><rect x="48" y="56" width="4" height="15" fill="#ffd700"/></svg>' },
  { id: 'av-6', name: 'Master Blaster', svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#1e1b4b" stroke="#e0e7ff" stroke-width="2"/><circle cx="50" cy="40" r="15" fill="#fcd34d"/><path d="M26 74 C26 60 36 54 50 54 C64 54 74 60 74 74 Z" fill="#4f46e5"/><path d="M48 62 L52 62 L54 74 L46 74 Z" fill="#fcd34d"/><circle cx="45" cy="40" r="2" fill="#000"/><circle cx="55" cy="40" r="2" fill="#000"/></svg>' }
];

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

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

const LOCAL_STORAGE_KEY = 'cricket_auction_local_db';

function getLocalDb() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function setLocalDb(state) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

export function useAuctionState() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('cricket_auction_mode') || 'local'; // Default to local for zero-config hosted deployment!
  });

  const [db, setDb] = useState(() => {
    const currentMode = localStorage.getItem('cricket_auction_mode') || 'local';
    if (currentMode === 'local') {
      return getLocalDb() || CLEAN_DB;
    }
    return CLEAN_DB;
  });

  const [connected, setConnected] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [registeredPlayerId, setRegisteredPlayerId] = useState(null);

  // Initialize authState from localStorage if available to preserve login across sessions
  const savedAuthState = (() => {
    try {
      const stored = localStorage.getItem('auth_state');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  })();
  const [authState, setAuthState] = useState(savedAuthState || {
    authenticated: false,
    role: null,
    teamId: null,
    teamName: null,
    auctioneerCode: null,
    auctioneerId: null,
    auctioneerPassword: null
  });

  // Persist authState changes to localStorage so it survives page reloads or inactivity
  useEffect(() => {
    try {
      localStorage.setItem('auth_state', JSON.stringify(authState));
    } catch (e) {
      // ignore storage errors
    }
  }, [authState]);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // Sync mode changes to localStorage
  const changeMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem('cricket_auction_mode', newMode);
    if (newMode === 'local') {
      const localData = getLocalDb() || CLEAN_DB;
      setLocalDb(localData);
      setDb(localData);
      setAuthState({
        authenticated: false,
        role: null,
        teamId: null,
        teamName: null,
        auctioneerCode: null,
        auctioneerId: null,
        auctioneerPassword: null
      });
    } else {
      setDb(CLEAN_DB);
    }
  };

  // Local helper to update and persist local state
  const updateLocalDb = (updater) => {
    setDb(prevDb => {
      const nextDb = typeof updater === 'function' ? updater(prevDb) : updater;
      setLocalDb(nextDb);
      window.dispatchEvent(new CustomEvent('local-db-updated'));
      return nextDb;
    });
  };

  // Sync state across browser tabs in local mode
  useEffect(() => {
    if (mode !== 'local') return;

    const handleStorageSync = () => {
      const localData = getLocalDb();
      if (localData) {
        setDb(localData);
      }
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('local-db-updated', handleStorageSync);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('local-db-updated', handleStorageSync);
    };
  }, [mode]);

  // Online socket setup
  useEffect(() => {
    if (mode !== 'online') {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const socketUrl = import.meta.env.VITE_BACKEND_URL || 
      (hostname === 'localhost' || hostname === '127.0.0.1' 
        ? `${protocol}//${hostname}:3000` 
        : window.location.origin);

    const socket = io(socketUrl, { reconnectionAttempts: 10, reconnectionDelay: 2000 });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('init-state', (serverDb) => setDb(serverDb));
    socket.on('state-updated', (serverDb) => setDb(serverDb));

    socket.on('auth-success', (data) => {
      setAuthError(null);
      setAuthState({
        authenticated: true,
        role: data.role,
        teamId: data.teamId || null,
        teamName: data.teamName || null,
        auctioneerCode: data.auctioneerCode || null,
        auctioneerId: data.auctioneerId || null,
        auctioneerPassword: data.auctioneerPassword || null
      });
    });

    socket.on('auth-error', (msg) => {
      setAuthError(msg);
      setTimeout(() => setAuthError(null), 4000);
    });

    socket.on('logged-out', () => {
      setAuthState({ authenticated: false, role: null, teamId: null, teamName: null, auctioneerCode: null, auctioneerId: null, auctioneerPassword: null });
    });

    socket.on('bid-error', (msg) => {
      setBidError(msg);
      setTimeout(() => setBidError(null), 3000);
    });

    socket.on('player-register-success', (playerId) => setRegisteredPlayerId(playerId));

    return () => {
      if (socket) socket.disconnect();
    };
  }, [mode]);

  // Local Mode auto-resolve for countdown timer
  const localExecuteAutoResolve = (currentDb) => {
    const { activePlayerId, currentBid, highestBidderId } = currentDb.auctionState;
    if (!activePlayerId) return currentDb;

    if (highestBidderId) {
      const winnerTeam = currentDb.teams.find(t => t.id === highestBidderId);
      const soldPlayer = currentDb.players.find(p => p.id === activePlayerId);
      if (!winnerTeam || !soldPlayer) return currentDb;

      return {
        ...currentDb,
        players: currentDb.players.map(p =>
          p.id === activePlayerId ? { ...p, status: 'sold', soldPrice: currentBid, soldToTeamId: highestBidderId } : p
        ),
        teams: currentDb.teams.map(t =>
          t.id === highestBidderId ? { ...t, budget: t.budget - currentBid, players: [...t.players, activePlayerId] } : t
        ),
        auctionState: {
          ...currentDb.auctionState,
          status: 'sold',
          timeLeft: 0
        }
      };
    } else {
      return {
        ...currentDb,
        players: currentDb.players.map(p =>
          p.id === activePlayerId ? { ...p, status: 'unsold' } : p
        ),
        auctionState: {
          ...currentDb.auctionState,
          status: 'unsold',
          timeLeft: 0
        }
      };
    }
  };

  // Local Mode timer execution
  useEffect(() => {
    if (mode !== 'local') return;

    if (db.auctionState.status === 'bidding' && db.auctionState.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        updateLocalDb(prev => {
          if (prev.auctionState.status !== 'bidding' || prev.auctionState.timeLeft <= 0) {
            clearInterval(timerRef.current);
            return prev;
          }
          const nextTime = prev.auctionState.timeLeft - 1;
          if (nextTime === 0) {
            clearInterval(timerRef.current);
            return localExecuteAutoResolve(prev);
          } else {
            return {
              ...prev,
              auctionState: {
                ...prev.auctionState,
                timeLeft: nextTime
              }
            };
          }
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode, db.auctionState.status, db.auctionState.timeLeft]);

  const emit = (event, data) => {
    if (socketRef.current) socketRef.current.emit(event, data);
  };

  // ── Wrapped Action Functions ──

  const loginAsAuctioneer = (code) => {
    if (mode === 'local') {
      const currentDb = getLocalDb() || db;
      // Allow auctioneer to login even before tournament is set up
      if (!currentDb.auctioneerRegistered) {
        setAuthError('No auctioneer registered yet. Please register first.');
        return;
      }
      if (typeof code === 'object' && code !== null) {
        const { loginId, loginPassword } = code;
        if (loginId === currentDb.auctioneerId && loginPassword === currentDb.auctioneerPassword) {
          setAuthState({
            authenticated: true,
            role: 'auctioneer',
            teamId: null,
            teamName: null,
            auctioneerCode: currentDb.auctioneerCode,
            auctioneerId: currentDb.auctioneerId,
            auctioneerPassword: currentDb.auctioneerPassword
          });
          return;
        }
        if (currentDb.auctioneerCode && loginId === 'admin' && loginPassword === currentDb.auctioneerCode) {
          setAuthState({
            authenticated: true,
            role: 'auctioneer',
            teamId: null,
            teamName: null,
            auctioneerCode: currentDb.auctioneerCode,
            auctioneerId: currentDb.auctioneerId,
            auctioneerPassword: currentDb.auctioneerPassword
          });
          return;
        }
      } else if (code === currentDb.auctioneerCode) {
        setAuthState({
          authenticated: true,
          role: 'auctioneer',
          teamId: null,
          teamName: null,
          auctioneerCode: currentDb.auctioneerCode,
          auctioneerId: currentDb.auctioneerId,
          auctioneerPassword: currentDb.auctioneerPassword
        });
        return;
      }
      setAuthError('Invalid Auctioneer ID or Password.');
    } else {
      emit('auth-auctioneer', code);
    }
  };

  const loginAsTeam = (loginId, loginPassword) => {
    if (mode === 'local') {
      const currentDb = getLocalDb() || db;
      if (!currentDb.setupComplete) {
        setAuthError('No tournament created yet.');
        return;
      }
      const team = currentDb.teams.find(t => t.loginId === loginId && t.loginPassword === loginPassword);
      if (!team) {
        setAuthError('Invalid Team ID or Password.');
        return;
      }
      setAuthState({
        authenticated: true,
        role: 'team',
        teamId: team.id,
        teamName: team.name,
        auctioneerCode: null,
        auctioneerId: null,
        auctioneerPassword: null
      });
    } else {
      emit('auth-team', { loginId, loginPassword });
    }
  };

  const logout = () => {
    if (mode === 'local') {
      // Clear persisted auth state on logout
      localStorage.removeItem('auth_state');
      setAuthState({ authenticated: false, role: null, teamId: null, teamName: null, auctioneerCode: null, auctioneerId: null, auctioneerPassword: null });
    } else {
      emit('logout');
      // Clear persisted auth state on logout
      localStorage.removeItem('auth_state');
      setAuthState({ authenticated: false, role: null, teamId: null, teamName: null, auctioneerCode: null, auctioneerId: null, auctioneerPassword: null });
    }
  };

  const setupTournament = (form) => {
    if (mode === 'local') {
      const auctioneerCode = 'AUC-' + generateCode(6);
      const auctioneerId = form.auctioneerId || 'admin';
      const auctioneerPassword = form.auctioneerPassword || generateCode(6);
      
      const teams = (form.teams || []).map(t => {
        const loginId = t.loginId || ('T-' + generateCode(4));
        const loginPassword = t.loginPassword || generateCode(6);
        const budget = Number(t.budget) || Number(form.startingBudget) || 80000000;
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
        setupComplete: true,
        auctioneerRegistered: true,
        auctioneerName: form.auctioneerName || 'Master Auctioneer',
        auctioneerCode,
        auctioneerId,
        auctioneerPassword,
        tournament: {
          name: form.tournamentName,
          auctioneer: form.auctioneerName || 'Master Auctioneer',
          gender: form.gender || 'Men',
          startingBudget: Number(form.startingBudget) || 80000000,
          minBidIncrement: Number(form.minBidIncrement) || 1000000,
          timerSeconds: Number(form.timerSeconds) || 30
        },
        teams,
        players: [],
        auctionState: { activePlayerId: null, currentBid: 0, highestBidderId: null, status: 'idle', timeLeft: 0, bidHistory: [] }
      };

      updateLocalDb(newDb);
      setAuthState({
        authenticated: true,
        role: 'auctioneer',
        teamId: null,
        teamName: null,
        auctioneerCode,
        auctioneerId,
        auctioneerPassword
      });
    } else {
      emit('setup-tournament', form);
    }
  };

  const addTeam = (form) => {
    if (mode === 'local') {
      updateLocalDb(prev => {
        const loginId = 'T-' + generateCode(4);
        const loginPassword = generateCode(6);
        const budget = Number(form.budget) || (prev.tournament ? prev.tournament.startingBudget : 50000000);
        const newTeam = {
          id: 'team-' + Math.random().toString(36).substr(2, 9),
          name: form.name,
          captain: form.captain,
          budget,
          players: [],
          loginId,
          loginPassword
        };
        return {
          ...prev,
          teams: [...prev.teams, newTeam]
        };
      });
    } else {
      emit('add-team', form);
    }
  };

  const deleteTeam = (teamId) => {
    if (mode === 'local') {
      updateLocalDb(prev => ({
        ...prev,
        teams: prev.teams.filter(t => t.id !== teamId)
      }));
    } else {
      emit('delete-team', teamId);
    }
  };

  const allocatePriceAndApprove = (playerId, basePrice) => {
    if (mode === 'local') {
      updateLocalDb(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, basePrice: Number(basePrice), status: 'approved' } : p
        )
      }));
    } else {
      emit('approve-player', { playerId, basePrice });
    }
  };

  const rejectPlayer = (playerId) => {
    if (mode === 'local') {
      updateLocalDb(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== playerId)
      }));
    } else {
      emit('reject-player', playerId);
    }
  };

  const startAuctionForPlayer = (playerId) => {
    if (mode === 'local') {
      updateLocalDb(prev => {
        const player = prev.players.find(p => p.id === playerId);
        if (!player) return prev;
        
        const updatedPlayers = prev.players.map(p => {
          if (p.id === playerId) return { ...p, status: 'active' };
          if (p.status === 'active') return { ...p, status: 'approved' };
          return p;
        });

        return {
          ...prev,
          players: updatedPlayers,
          auctionState: {
            activePlayerId: playerId,
            currentBid: player.basePrice || 0,
            highestBidderId: null,
            status: 'bidding',
            timeLeft: prev.tournament ? prev.tournament.timerSeconds : 30,
            bidHistory: []
          }
        };
      });
    } else {
      emit('start-auction-player', playerId);
    }
  };

  const placeBid = (forcedTeamId = null) => {
    if (mode === 'local') {
      const teamId = forcedTeamId || authState.teamId;
      if (!teamId) {
        setBidError('Authentication required to bid.');
        return { success: false };
      }

      let success = false;
      updateLocalDb(prev => {
        const { activePlayerId, currentBid, highestBidderId, status } = prev.auctionState;
        if (status !== 'bidding') return prev;

        const player = prev.players.find(p => p.id === activePlayerId);
        const team = prev.teams.find(t => t.id === teamId);
        if (!player || !team) return prev;

        const increment = prev.tournament ? prev.tournament.minBidIncrement : 1000000;
        const nextBid = highestBidderId ? (currentBid + increment) : currentBid;

        if (team.budget < nextBid) {
          setTimeout(() => setBidError('Insufficient budget!'), 10);
          return prev;
        }
        if (highestBidderId === teamId) {
          setTimeout(() => setBidError('You already hold the highest bid!'), 10);
          return prev;
        }

        success = true;
        const updatedBidHistory = [
          {
            teamId,
            teamName: team.name,
            captain: team.captain,
            bidAmount: nextBid,
            timestamp: Date.now()
          },
          ...prev.auctionState.bidHistory
        ];

        return {
          ...prev,
          auctionState: {
            ...prev.auctionState,
            currentBid: nextBid,
            highestBidderId: teamId,
            timeLeft: prev.tournament ? prev.tournament.timerSeconds : 30,
            bidHistory: updatedBidHistory
          }
        };
      });

      return { success };
    } else {
      emit('place-bid');
      return { success: true };
    }
  };

  const handleDeclareSold = () => {
    if (mode === 'local') {
      updateLocalDb(prev => localExecuteAutoResolve(prev));
    } else {
      emit('declare-sold');
    }
  };

  const handleDeclareUnsold = () => {
    if (mode === 'local') {
      updateLocalDb(prev => {
        const { activePlayerId } = prev.auctionState;
        if (!activePlayerId) return prev;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === activePlayerId ? { ...p, status: 'unsold' } : p
          ),
          auctionState: {
            ...prev.auctionState,
            status: 'unsold',
            timeLeft: 0
          }
        };
      });
    } else {
      emit('declare-unsold');
    }
  };

  const toggleBiddingTimer = () => {
    if (mode === 'local') {
      updateLocalDb(prev => {
        const currentStatus = prev.auctionState.status;
        if (currentStatus === 'bidding') {
          return {
            ...prev,
            auctionState: { ...prev.auctionState, status: 'paused' }
          };
        } else if (currentStatus === 'paused') {
          return {
            ...prev,
            auctionState: { ...prev.auctionState, status: 'bidding' }
          };
        }
        return prev;
      });
    } else {
      emit('toggle-timer');
    }
  };

  const registerPlayer = (form) => {
    if (mode === 'local') {
      const newPlayerId = 'play-' + Math.random().toString(36).substr(2, 9);
      updateLocalDb(prev => {
        const newPlayer = {
          id: newPlayerId,
          name: form.name,
          avatarUrl: form.avatarUrl || '',
          avatarPreset: form.avatarPreset || 'av-1',
          role: form.role,
          battingStyle: form.battingStyle,
          bowlingStyle: form.bowlingStyle,
          basePrice: 0,
          status: 'pending',
          soldPrice: 0,
          soldToTeamId: null
        };
        return {
          ...prev,
          players: [...prev.players, newPlayer]
        };
      });
      setRegisteredPlayerId(newPlayerId);
    } else {
      setRegisteredPlayerId(null);
      emit('register-player', form);
    }
  };

  const resetDatabase = () => {
    if (mode === 'local') {
      updateLocalDb(CLEAN_DB);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      logout();
    } else {
      emit('reset-db');
    }
  };

  const registerAuctioneer = (form) => {
    if (mode === 'local') {
      updateLocalDb(prev => ({
        ...prev,
        auctioneerRegistered: true,
        auctioneerName: form.auctioneerName,
        auctioneerId: form.auctioneerId,
        auctioneerPassword: form.auctioneerPassword,
        tournamentName: form.tournamentName
      }));
    } else {
      emit('register-auctioneer', form);
    }
  };

  const togglePlaying11 = (playerId) => {
    if (mode === 'local') {
      let errorMsg = null;
      updateLocalDb(prev => {
        const player = prev.players.find(p => p.id === playerId);
        if (!player) return prev;

        if (player.status !== 'sold') {
          errorMsg = 'Only sold players can be selected for the Playing XI.';
          return prev;
        }

        const squadTeamId = player.soldToTeamId;
        const currentPlaying11Count = prev.players.filter(p => p.soldToTeamId === squadTeamId && p.isPlaying11).length;

        if (!player.isPlaying11 && currentPlaying11Count >= 11) {
          errorMsg = 'Roster Limit Exceeded! A playing XI can have at most 11 players.';
          return prev;
        }

        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId ? { ...p, isPlaying11: !p.isPlaying11 } : p
          )
        };
      });
      if (errorMsg) {
        setBidError(errorMsg);
        setTimeout(() => setBidError(null), 3000);
      }
    } else {
      emit('toggle-playing11', { playerId });
    }
  };

  return {
    db, 
    connected: mode === 'local' ? true : connected, 
    bidError, 
    authError,
    clearAuthError: () => setAuthError(null),
    authState, 
    registeredPlayerId, 
    setRegisteredPlayerId,
    loginAsAuctioneer, 
    loginAsTeam, 
    logout,
    setupTournament, 
    addTeam, 
    deleteTeam,
    allocatePriceAndApprove, 
    rejectPlayer,
    startAuctionForPlayer, 
    placeBid,
    handleDeclareSold, 
    handleDeclareUnsold,
    toggleBiddingTimer, 
    registerPlayer, 
    resetDatabase,
    registerAuctioneer, 
    togglePlaying11,
    mode, 
    changeMode
  };
}
