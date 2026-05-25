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

export function useAuctionState() {
  const [db, setDb] = useState({
    setupComplete: false,
    auctioneerCode: null,
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
  });

  const [connected, setConnected] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [registeredPlayerId, setRegisteredPlayerId] = useState(null);

  // Auth state: { authenticated, role, teamId, teamName, auctioneerCode, auctioneerId, auctioneerPassword }
  const [authState, setAuthState] = useState({
    authenticated: false,
    role: null,
    teamId: null,
    teamName: null,
    auctioneerCode: null,
    auctioneerId: null,
    auctioneerPassword: null
  });

  const socketRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const socketUrl = import.meta.env.VITE_BACKEND_URL || `${protocol}//${hostname}:3000`;

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

    return () => { if (socket) socket.disconnect(); };
  }, []);

  const emit = (event, data) => { if (socketRef.current) socketRef.current.emit(event, data); };

  // ── Auth actions ──
  const loginAsAuctioneer = (code) => emit('auth-auctioneer', code);
  const loginAsTeam = (loginId, loginPassword) => emit('auth-team', { loginId, loginPassword });
  const logout = () => {
    emit('logout');
    setAuthState({ authenticated: false, role: null, teamId: null, teamName: null, auctioneerCode: null, auctioneerId: null, auctioneerPassword: null });
  };

  // ── Auctioneer actions ──
  const setupTournament = (form) => emit('setup-tournament', form);
  const addTeam = (form) => emit('add-team', form);
  const deleteTeam = (teamId) => emit('delete-team', teamId);
  const allocatePriceAndApprove = (playerId, basePrice) => emit('approve-player', { playerId, basePrice });
  const rejectPlayer = (playerId) => emit('reject-player', playerId);
  const startAuctionForPlayer = (playerId) => emit('start-auction-player', playerId);
  const handleDeclareSold = () => emit('declare-sold');
  const handleDeclareUnsold = () => emit('declare-unsold');
  const toggleBiddingTimer = () => emit('toggle-timer');
  const resetDatabase = () => emit('reset-db');

  // ── Team action (no teamId param — server reads it from socket auth) ──
  const placeBid = () => {
    emit('place-bid');
    return { success: true };
  };

  // ── Player action ──
  const registerPlayer = (form) => {
    setRegisteredPlayerId(null);
    emit('register-player', form);
  };

  const registerAuctioneer = (form) => {
    emit('register-auctioneer', form);
  };

  const togglePlaying11 = (playerId) => {
    emit('toggle-playing11', { playerId });
  };

  return {
    db, connected, bidError, authError,
    authState, registeredPlayerId, setRegisteredPlayerId,
    loginAsAuctioneer, loginAsTeam, logout,
    setupTournament, addTeam, deleteTeam,
    allocatePriceAndApprove, rejectPlayer,
    startAuctionForPlayer, placeBid,
    handleDeclareSold, handleDeclareUnsold,
    toggleBiddingTimer, registerPlayer, resetDatabase,
    registerAuctioneer, togglePlaying11
  };
}
