import { useState, useEffect } from 'react';
import { useAuctionState, PRESET_AVATARS, formatCurrency } from './hooks/useAuctionState';
import './App.css';

function generateReadableCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function RosterShowcasePitch({
  db,
  authState,
  togglePlaying11,
  renderAvatarSVG,
  formatCurrency
}) {
  const teams = db.teams || [];

  if (teams.length === 0) {
    return (
      <div className="lobby-empty-card flex-center flex-column section-padding glass-panel">
        <div className="icon">🏆</div>
        <h3 className="sporty-title">No Squads Configured</h3>
        <p className="text-secondary text-sm">Please register teams under the setup or administrative channels to construct Playing XIs.</p>
      </div>
    );
  }

  return (
    <div className="roster-showcase-flow flex-column gap-20 width-full" style={{ padding: '10px 0' }}>
      {/* Dynamic Header */}
      <div className="pitch-card-header text-center" style={{ marginBottom: '10px' }}>
        <span className="text-xs text-gold uppercase tracking-wider font-bold block" style={{ letterSpacing: '2px', color: 'var(--gold-accent)' }}>
          🏆 TOURNAMENT SQUAD BOARD
        </span>
        <h2 className="sporty-title glow-text-gold" style={{ fontSize: '1.8rem', marginTop: '6px', letterSpacing: '1px' }}>
          TEAM SQUADS & ROSTERS
        </h2>
        <p className="text-secondary text-xs" style={{ maxWidth: '600px', margin: '8px auto 0 auto', lineHeight: '1.5' }}>
          Real-time roster logs after the active auction session. Manage Playing XI squads directly using the action selectors below.
        </p>
      </div>

      {/* Grid of Team Cards */}
      <div className="team-squads-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        width: '100%'
      }}>
        {teams.map(team => {
          // Find all players sold to this team
          const squadPlayers = db.players.filter(p => p.soldToTeamId === team.id && p.status === 'sold');
          
          // Sort squad players: Playing XI first, then alphabetically or by role
          const sortedPlayers = [...squadPlayers].sort((a, b) => {
            if (a.isPlaying11 && !b.isPlaying11) return -1;
            if (!a.isPlaying11 && b.isPlaying11) return 1;
            return a.name.localeCompare(b.name);
          });

          const activeXICount = squadPlayers.filter(p => p.isPlaying11).length;
          const isMyTeam = authState.role === 'team' && authState.teamId === team.id;
          const isUserAuctioneer = authState.role === 'auctioneer';
          const isEditable = isMyTeam || isUserAuctioneer;

          return (
            <div 
              key={team.id} 
              className={`team-squad-card glass-panel flex-column gap-16`}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: isMyTeam ? '2px solid var(--gold-accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: isMyTeam ? '0 12px 40px rgba(255, 215, 0, 0.15)' : '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isMyTeam && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '20px',
                  background: 'var(--gold-accent)',
                  color: '#000',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderBottomLeftRadius: '8px',
                  borderBottomRightRadius: '8px',
                  letterSpacing: '1px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  MY TEAM
                </div>
              )}

              {/* Team Card Header */}
              <div className="team-card-header border-bottom" style={{ paddingBottom: '14px' }}>
                <div className="flex-center gap-12" style={{ justifyContent: 'flex-start' }}>
                  <div className="team-avatar-square flex-center" style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '1.4rem'
                  }}>
                    🛡️
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 className="sporty-title text-gold font-bold" style={{ fontSize: '1.25rem', margin: 0, letterSpacing: '0.5px' }}>
                      {team.name}
                    </h3>
                    <span className="text-xxs text-muted block uppercase" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                      Captain: <strong className="text-light" style={{ color: '#fff' }}>{team.captain}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex-between margin-t-12" style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px' }}>
                  <span className="text-secondary">
                    Budget: <strong className="text-green" style={{ color: 'var(--green-accent)' }}>{formatCurrency(team.budget)}</strong>
                  </span>
                  <span className="text-secondary">
                    XI: <strong className={activeXICount === 11 ? 'text-green' : 'text-gold'}>{activeXICount}/11 Players</strong>
                  </span>
                </div>
              </div>

              {/* Player Roster List */}
              <div className="team-roster-list flex-column gap-8" style={{
                maxHeight: '380px',
                overflowY: 'auto',
                paddingRight: '6px'
              }}>
                {sortedPlayers.length === 0 ? (
                  <div className="text-center padding-20 text-muted italic text-xs" style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    No players purchased in this session yet.
                  </div>
                ) : (
                  sortedPlayers.map(player => (
                    <div 
                      key={player.id} 
                      className={`squad-roster-row-item glass-panel flex-between ${player.isPlaying11 ? 'in-xi-row-glow' : ''}`}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: player.isPlaying11 ? 'rgba(255, 215, 0, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                        border: player.isPlaying11 ? '1px solid rgba(255, 215, 0, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div className="flex-center gap-8" style={{ justifyContent: 'flex-start' }}>
                        <div className="mini-avatar" style={{ width: '30px', height: '30px', flexShrink: 0 }}>
                          {renderAvatarSVG(player.avatarPreset, player.avatarUrl)}
                        </div>
                        <div className="text-left" style={{ overflow: 'hidden' }}>
                          <span className="text-xs font-bold block truncate" style={{ maxWidth: '120px', color: player.isPlaying11 ? 'var(--gold-accent)' : '#fff' }}>
                            {player.name}
                          </span>
                          <span className="badge-role text-xxs" style={{
                            fontSize: '0.6rem',
                            padding: '1px 5px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            color: 'rgba(255,255,255,0.6)'
                          }}>
                            {player.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex-center gap-8" style={{ justifyContent: 'flex-end', flexShrink: 0 }}>
                        <span className="text-gold font-bold text-xs" style={{ fontSize: '0.75rem' }}>
                          {formatCurrency(player.soldPrice)}
                        </span>

                        {isEditable ? (
                          <button
                            className={`btn-premium btn-xxs flex-center`}
                            onClick={() => togglePlaying11(player.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.65rem',
                              borderRadius: '6px',
                              minWidth: '58px',
                              background: player.isPlaying11 ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 215, 0, 0.1)',
                              border: player.isPlaying11 ? '1px solid #f44336' : '1px solid var(--gold-accent)',
                              color: player.isPlaying11 ? '#ff5252' : 'var(--gold-accent)',
                              cursor: 'pointer'
                            }}
                            title={player.isPlaying11 ? "Remove from Playing XI" : "Assign to Playing XI"}
                          >
                            {player.isPlaying11 ? '➖ XI' : '➕ XI'}
                          </button>
                        ) : (
                          <span 
                            style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: player.isPlaying11 ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.03)',
                              color: player.isPlaying11 ? 'var(--green-accent)' : 'rgba(255,255,255,0.3)',
                              fontWeight: 'bold',
                              border: player.isPlaying11 ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid transparent'
                            }}
                          >
                            {player.isPlaying11 ? 'XI' : 'Sub'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MVPShowcase({ mvpPlayer, mvpTeam, renderAvatarSVG, formatCurrency }) {
  if (!mvpPlayer) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,140,0,0.05) 100%)',
      border: '2px solid rgba(255,215,0,0.4)',
      borderRadius: '24px',
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 0 60px rgba(255,215,0,0.15), 0 8px 40px rgba(0,0,0,0.4)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      marginBottom: '10px'
    }}>
      {/* Glowing radial background */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(255,215,0,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
        <span style={{ fontSize: '1.6rem' }}>🏆</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', fontWeight: 'bold' }}>AUCTION COMPLETE</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ffd700', letterSpacing: '1.5px', textShadow: '0 0 20px rgba(255,215,0,0.6)', fontFamily: 'sans-serif' }}>MOST VALUABLE PLAYER</div>
        </div>
        <span style={{ fontSize: '1.6rem' }}>🏆</span>
      </div>

      {/* Player card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        background: 'rgba(0,0,0,0.35)',
        borderRadius: '18px',
        padding: '20px 28px',
        border: '1px solid rgba(255,215,0,0.25)',
        zIndex: 1,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Avatar with glow ring */}
        <div style={{
          width: '90px', height: '90px',
          borderRadius: '50%',
          background: 'rgba(255,215,0,0.05)',
          border: '3px solid rgba(255,215,0,0.5)',
          boxShadow: '0 0 30px rgba(255,215,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0
        }}>
          {renderAvatarSVG(mvpPlayer.avatarPreset, mvpPlayer.avatarUrl)}
        </div>

        {/* Player info */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px', lineHeight: 1.1 }}>{mvpPlayer.name}</div>
          <span style={{
            display: 'inline-block', marginTop: '6px',
            fontSize: '0.7rem', padding: '3px 10px',
            borderRadius: '6px', background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase'
          }}>{mvpPlayer.role}</span>
          <div style={{ marginTop: '10px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>🏏 {mvpPlayer.battingStyle}</div>
            {mvpPlayer.bowlingStyle && mvpPlayer.bowlingStyle !== 'None' && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>🎯 {mvpPlayer.bowlingStyle}</div>
            )}
          </div>
        </div>

        {/* Sold price */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Hammer Price</div>
          <div style={{
            fontSize: '2rem', fontWeight: 'bold',
            color: '#ffd700',
            textShadow: '0 0 20px rgba(255,215,0,0.7)',
            fontFamily: 'monospace'
          }}>{formatCurrency(mvpPlayer.soldPrice)}</div>
          {mvpTeam && (
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
              Acquired by <strong style={{ color: '#fff' }}>{mvpTeam.name}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const {
    db,
    connected,
    bidError,
    authError,
    clearAuthError,
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
  } = useAuctionState();

  // Unified Page navigation view: 'landing' | 'auc_login' | 'auc_register' | 'auctioneer' | 'live_auction_gate' | 'squad_showcase' | 'player_register'
  const [activePortal, setActivePortal] = useState('landing');
  const [showSidebar, setShowSidebar] = useState(false);

  // Registration Form state
  const [registerForm, setRegisterForm] = useState({
    auctioneerName: '',
    auctioneerId: '',
    auctioneerPassword: ''
  });

  // Authentication UI Input States
  const [aucIdInput, setAucIdInput] = useState('');
  const [aucPasswordInput, setAucPasswordInput] = useState('');
  const [teamIdInput, setTeamIdInput] = useState('');
  const [teamPasswordInput, setTeamPasswordInput] = useState('');

  // Setup forms
  const [setupForm, setSetupForm] = useState({
    tournamentName: '',
    auctioneerName: '',
    gender: 'Men',
    startingBudget: 80000000,
    minBidIncrement: 1000000,
    timerSeconds: 30,
    auctioneerId: '',
    auctioneerPassword: generateReadableCode(6)
  });

  const [setupTeams, setSetupTeams] = useState([]);
  const [tempTeam, setTempTeam] = useState({ name: '', captain: '' });

  // Player registration form
  const [playerForm, setPlayerForm] = useState({
    name: '',
    role: 'Batsman',
    battingStyle: 'Right Hand',
    bowlingStyle: 'None',
    avatarPreset: 'av-1',
    avatarUrl: '',
    isSubmitted: false
  });

  // Team creation form (Auctioneer dashboard)
  const [teamForm, setTeamForm] = useState({
    name: '',
    captain: '',
    budget: ''
  });

  // Allocation forms (for pricing)
  const [priceAllocation, setPriceAllocation] = useState({});

  // Auctioneer Dashboard Tab Selection ('live' | 'management' | 'pitch')
  const [auctioneerTab, setAuctioneerTab] = useState('live');

  // Selected showcase team for squads & playing XI view
  const [selectedShowcaseTeamId, setSelectedShowcaseTeamId] = useState(null);

  // Captain Dashboard Tab Selection ('live' | 'pitch')
  const [captainTab, setCaptainTab] = useState('live');

  // Real-time clipboard feedback
  const [copyFeedback, setCopyFeedback] = useState('');

  // Handle URL query parameters for player registration link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'player-register') {
      setActivePortal('player_register');
    }
  }, []);

  const formatShortCurrency = (val) => {
    if (val >= 10000000) {
      return `${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `${(val / 100000).toFixed(2)} L`;
    }
    return val.toLocaleString('en-IN');
  };

  // Copy player registration invite link
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}${window.location.pathname}?view=player-register`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopyFeedback('Player Invite Link Copied!');
      setTimeout(() => setCopyFeedback(''), 3000);
    });
  };

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (setupTeams.length === 0) {
      alert("Please add at least one team before registering the tournament.");
      return;
    }
    setupTournament({
      ...setupForm,
      teams: setupTeams
    });
  };

  const addTeamToSetup = (e) => {
    e.preventDefault();
    if (!tempTeam.name.trim() || !tempTeam.captain.trim()) return;
    
    // Auto-generate credentials for this team
    const loginId = 'T-' + generateReadableCode(4);
    const loginPassword = generateReadableCode(6);
    
    const newTeam = {
      name: tempTeam.name.trim(),
      captain: tempTeam.captain.trim(),
      loginId,
      loginPassword
    };
    
    setSetupTeams([...setupTeams, newTeam]);
    setTempTeam({ name: '', captain: '' });
  };
  
  const removeTeamFromSetup = (index) => {
    setSetupTeams(setupTeams.filter((_, idx) => idx !== index));
  };

  const handlePlayerSubmit = (e) => {
    e.preventDefault();
    if (!playerForm.name.trim()) return;
    registerPlayer({
      name: playerForm.name,
      role: playerForm.role,
      battingStyle: playerForm.battingStyle,
      bowlingStyle: playerForm.bowlingStyle,
      avatarPreset: playerForm.avatarPreset,
      avatarUrl: playerForm.avatarUrl
    });
    setPlayerForm(prev => ({ ...prev, isSubmitted: true }));
  };

  const handleAddTeamSubmit = (e) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.captain.trim()) return;
    const budget = Number(teamForm.budget) || (db.tournament ? db.tournament.startingBudget : 50000000);
    addTeam({ name: teamForm.name, captain: teamForm.captain, budget });
    setTeamForm({ name: '', captain: '', budget: '' });
  };

  const activePlayer = db.players.find(p => p.id === db.auctionState.activePlayerId);
  const activeBidderTeam = db.teams.find(t => t.id === db.auctionState.highestBidderId);

  // Helper to render SVGs safely
  const renderAvatarSVG = (presetId, customUrl) => {
    if (customUrl) {
      return <img src={customUrl} alt="Player Avatar" className="avatar-img" />;
    }
    const preset = PRESET_AVATARS.find(av => av.id === presetId) || PRESET_AVATARS[0];
    return <div className="avatar-svg-container" dangerouslySetInnerHTML={{ __html: preset.svg }} />;
  };

  const handleLogout = () => {
    logout();
    setActivePortal('landing');
  };

  // Auto-navigate to auctioneer dashboard on successful login
  const handleAuctioneerLogin = (e) => {
    e.preventDefault();
    loginAsAuctioneer({ loginId: aucIdInput.trim(), loginPassword: aucPasswordInput.trim() });
    // Navigation will happen via useEffect below when authState updates
  };

  // Watch for successful auth and redirect to dashboard
  useEffect(() => {
    if (authState.authenticated && authState.role === 'auctioneer' && activePortal === 'auc_login') {
      setActivePortal('auctioneer');
    }
  }, [authState.authenticated, authState.role, activePortal]);

  // Pre-populate setup form with registered auctioneer details
  useEffect(() => {
    if (authState.authenticated && authState.role === 'auctioneer' && db) {
      setSetupForm(prev => ({
        ...prev,
        tournamentName: db.tournamentName || db.tournament?.name || prev.tournamentName || '',
        auctioneerName: db.auctioneerName || prev.auctioneerName || '',
        auctioneerId: db.auctioneerId || authState.auctioneerId || prev.auctioneerId || '',
        auctioneerPassword: db.auctioneerPassword || authState.auctioneerPassword || prev.auctioneerPassword || ''
      }));
    }
  }, [authState.authenticated, authState.role, db.auctioneerRegistered, db.tournamentName, db.auctioneerName, db.auctioneerId, db.auctioneerPassword]);

  return (
    <div className="app-container animate-fade-in">
      {/* Sidebar Drawer overlay */}
      {showSidebar && (
        <div className="sidebar-nav-backdrop" onClick={() => setShowSidebar(false)} />
      )}
      
      {/* Mobile Sidebar Navigation Drawer */}
      <div className={`sidebar-nav-container ${showSidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span style={{ fontSize: '1.25rem' }}>🏏</span>
            <h3 className="sidebar-brand-title">AUCTION NAV</h3>
          </div>
          <button className="btn-sidebar-close" onClick={() => setShowSidebar(false)}>✕</button>
        </div>
        <div className="sidebar-content">
          <button 
            className={`sidebar-nav-item ${activePortal === 'landing' ? 'active' : ''}`}
            onClick={() => { setActivePortal('landing'); setShowSidebar(false); }}
          >
            🏠 Home
          </button>

          {/* Pre-login: show Login/Register options. Post-login: show dashboard links */}
          {!authState.authenticated ? (
            <>
              <button 
                className={`sidebar-nav-item ${activePortal === 'auc_login' ? 'active' : ''}`}
                onClick={() => { setActivePortal('auc_login'); setShowSidebar(false); }}
              >
                🔑 Login as Auctioneer
              </button>
              <button 
                className={`sidebar-nav-item ${activePortal === 'auc_register' ? 'active' : ''}`}
                onClick={() => { setActivePortal('auc_register'); setShowSidebar(false); }}
              >
                📝 Register as Auctioneer
              </button>
            </>
          ) : authState.role === 'auctioneer' ? (
            <>
              <button 
                className={`sidebar-nav-item ${activePortal === 'auctioneer' ? 'active' : ''}`}
                onClick={() => { setActivePortal('auctioneer'); setShowSidebar(false); }}
              >
                🎙️ Admin Dashboard
              </button>
              <button 
                className={`sidebar-nav-item ${activePortal === 'live_auction_gate' ? 'active' : ''}`}
                onClick={() => { setActivePortal('live_auction_gate'); setShowSidebar(false); }}
              >
                🏟️ Captains Lobby
              </button>
              <button 
                className={`sidebar-nav-item ${activePortal === 'squad_showcase' ? 'active' : ''}`}
                onClick={() => { setActivePortal('squad_showcase'); setShowSidebar(false); }}
              >
                📋 Squads & Playing XI
              </button>
            </>
          ) : (
            <button 
              className={`sidebar-nav-item ${activePortal === 'live_auction_gate' ? 'active' : ''}`}
              onClick={() => { setActivePortal('live_auction_gate'); setShowSidebar(false); }}
            >
              🏟️ Captains Lobby
            </button>
          )}

          <button 
            className={`sidebar-nav-item ${activePortal === 'player_register' ? 'active' : ''}`}
            onClick={() => { setActivePortal('player_register'); setShowSidebar(false); }}
          >
            🏃 Join Draft Pool
          </button>
        </div>
        <div className="sidebar-footer text-center">
          {authState.authenticated ? (
            <button className="btn-premium btn-logout btn-xs width-full" onClick={() => { handleLogout(); setShowSidebar(false); }}>
              Exit Session 🚪
            </button>
          ) : (
            <div className="text-xxs text-muted">Stadium Auction v1.5.0</div>
          )}
        </div>
      </div>

      {/* Top Header Navbar */}
      <header className="glass-panel main-header flex-between">
        <div className="header-brand flex-center gap-12">
          <button 
            className="btn-sidebar-toggle"
            onClick={() => setShowSidebar(true)}
          >
            ☰ MENU
          </button>
          <div className="cricket-ball-icon">🏏</div>
          <div>
            <h1 className="sporty-title glow-text-gold" style={{ fontSize: '1.15rem', margin: 0 }}>
              {db.tournament?.name || "STADIUM AUCTION"}
            </h1>
            {authState.authenticated && (
              <span className="text-xxs text-secondary block" style={{ marginTop: '2px', fontWeight: 'bold' }}>
                {authState.role === 'auctioneer' ? '🎙️ AUCTIONEER ACTIVE' : `⚡ CAPTAIN: ${authState.teamName}`}
              </span>
            )}
          </div>
        </div>

        {/* Center Desktop Navigation — Context-aware 4-option layout */}
        <nav className="desktop-nav">
          {/* HOME is always visible */}
          <button 
            className={`nav-link ${activePortal === 'landing' ? 'active' : ''}`}
            onClick={() => setActivePortal('landing')}
          >
            🏠 Home
          </button>

          {/* Pre-login navigation */}
          {!authState.authenticated && (
            <>
              <button 
                id="nav-login-auctioneer"
                className={`nav-link ${activePortal === 'auc_login' ? 'active' : ''}`}
                onClick={() => setActivePortal('auc_login')}
              >
                🔑 Login as Auctioneer
              </button>
              <button 
                id="nav-register-auctioneer"
                className={`nav-link ${activePortal === 'auc_register' ? 'active' : ''}`}
                onClick={() => setActivePortal('auc_register')}
              >
                📝 Register as Auctioneer
              </button>
            </>
          )}

          {/* Post-login auctioneer navigation */}
          {authState.authenticated && authState.role === 'auctioneer' && (
            <>
              <button 
                className={`nav-link active-dashboard ${activePortal === 'auctioneer' ? 'active' : ''}`}
                onClick={() => setActivePortal('auctioneer')}
              >
                🎙️ Admin Dashboard
              </button>
              <button 
                className={`nav-link ${activePortal === 'live_auction_gate' ? 'active' : ''}`}
                onClick={() => setActivePortal('live_auction_gate')}
              >
                🏟️ Captains Lobby
              </button>
              <button 
                className={`nav-link ${activePortal === 'squad_showcase' ? 'active' : ''}`}
                onClick={() => setActivePortal('squad_showcase')}
              >
                📋 Squads
              </button>
            </>
          )}

          {/* Post-login captain navigation */}
          {authState.authenticated && authState.role === 'team' && (
            <button 
              className={`nav-link active-dashboard ${activePortal === 'live_auction_gate' ? 'active' : ''}`}
              onClick={() => setActivePortal('live_auction_gate')}
            >
              🏟️ Captains Lobby
            </button>
          )}

          {/* Join Draft is always visible */}
          <button 
            id="nav-join-draft"
            className={`nav-link ${activePortal === 'player_register' ? 'active' : ''}`}
            onClick={() => setActivePortal('player_register')}
          >
            🏃 Join Draft
          </button>
        </nav>

        {/* Right side controls */}
        <div className="header-controls flex-center gap-12">
          <button 
            className="btn-premium btn-secondary btn-sm"
            onClick={() => changeMode(mode === 'local' ? 'online' : 'local')}
            style={{ background: mode === 'local' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
          >
            🔄 {mode === 'local' ? 'Solo Mode' : 'Online Mode'}
          </button>
          
          <div className={`connection-badge ${mode === 'local' ? 'connected' : connected ? 'connected' : 'disconnected'}`} style={{
            background: mode === 'local' ? 'rgba(255, 215, 0, 0.15)' : undefined,
            borderColor: mode === 'local' ? 'var(--gold-accent)' : undefined,
            color: mode === 'local' ? 'var(--gold-accent)' : undefined
          }}>
            {mode === 'local' ? '● LOCAL' : connected ? '● ONLINE' : '○ OFFLINE'}
          </div>

          {authState.authenticated ? (
            <div className="flex-center gap-8 border-left" style={{ paddingLeft: '12px', borderLeft: '1px solid var(--glass-border)' }}>
              <span className="role-label-badge" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                {authState.role === 'auctioneer' ? '🎙️ Admin' : `⚡ ${authState.teamName}`}
              </span>
              <button className="btn-premium btn-logout btn-xs" onClick={handleLogout}>
                Exit 🚪
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* ── Auth Error Modal ── */}
      {authError && (
        <div className="auth-error-overlay" onClick={clearAuthError}>
          <div className="auth-error-modal" onClick={e => e.stopPropagation()}>
            <div className="auth-error-icon-wrap">
              <span className="auth-error-icon">🔐</span>
            </div>
            <div className="auth-error-body">
              <h4 className="auth-error-title">Authentication Failed</h4>
              <p className="auth-error-msg">{authError}</p>
            </div>
            <button className="auth-error-close" onClick={clearAuthError} aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}
      {bidError && (
        <div className="auth-error-overlay" onClick={() => {}} style={{ pointerEvents: 'none' }}>
          <div className="auth-error-modal bid-error-modal" style={{ pointerEvents: 'all' }}>
            <div className="auth-error-icon-wrap" style={{ background: 'rgba(217,4,41,0.15)', borderColor: 'rgba(217,4,41,0.4)' }}>
              <span className="auth-error-icon">⚡</span>
            </div>
            <div className="auth-error-body">
              <h4 className="auth-error-title">Bid Error</h4>
              <p className="auth-error-msg">{bidError}</p>
            </div>
          </div>
        </div>
      )}

      {copyFeedback && (
        <div className="copy-feedback-banner animate-pulse-glow" style={{ top: '80px' }}>
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Main Content Render Layout */}
      <main className="main-content" style={{ marginTop: '20px' }}>
        
        {/* ── VIEW 1: HOME LANDING PAGE ── */}
        {activePortal === 'landing' && (
          <div className="landing-page animate-fade-in">
            {/* Hero Section */}
            <div className="landing-hero">
              <div className="landing-hero-badge">
                <span className="live-dot"></span>
                {db.setupComplete && db.tournament ? `🏏 LIVE: ${db.tournament.name}` : '🏏 CRICKET AUCTION PLATFORM'}
              </div>
              <h1 className="sporty-title glow-text-gold" style={{ fontSize: '3.4rem', textShadow: '0 0 30px var(--gold-glow)', lineHeight: 1.1, marginBottom: '16px' }}>
                STADIUM CRICKET AUCTION
              </h1>
              <p className="hero-subtitle" style={{ maxWidth: '600px', margin: '0 auto 40px auto' }}>
                The ultimate premium live bidding and drafting arena. Orchestrate your team selections with state-of-the-art administrative consoles and real-time captain bidding wars.
              </p>

              {/* Primary CTA cards */}
              {authState.authenticated ? (
                /* Post-login hero */
                <div className="landing-cta-grid">
                  {authState.role === 'auctioneer' ? (
                    <>
                      <div className="landing-cta-card glass-panel" onClick={() => setActivePortal('auctioneer')} style={{ borderColor: 'rgba(255,215,0,0.3)', cursor: 'pointer' }}>
                        <span className="cta-icon">🎙️</span>
                        <h3 className="sporty-title text-gold">Admin Dashboard</h3>
                        <p className="text-secondary text-xs">Manage live auction, approvals, teams & bidding</p>
                        <button className="btn-premium btn-gold btn-sm" style={{ marginTop: '12px' }}>Enter Console →</button>
                      </div>
                      <div className="landing-cta-card glass-panel" onClick={() => setActivePortal('live_auction_gate')} style={{ cursor: 'pointer' }}>
                        <span className="cta-icon">🏟️</span>
                        <h3 className="sporty-title">Captains Lobby</h3>
                        <p className="text-secondary text-xs">View the live bidding lobby as a spectator</p>
                        <button className="btn-premium btn-secondary btn-sm" style={{ marginTop: '12px' }}>Open Lobby →</button>
                      </div>
                      <div className="landing-cta-card glass-panel" onClick={() => setActivePortal('squad_showcase')} style={{ cursor: 'pointer' }}>
                        <span className="cta-icon">📋</span>
                        <h3 className="sporty-title">Squads & Playing XI</h3>
                        <p className="text-secondary text-xs">View all team rosters and playing XI</p>
                        <button className="btn-premium btn-secondary btn-sm" style={{ marginTop: '12px' }}>View Squads →</button>
                      </div>
                    </>
                  ) : (
                    <div className="landing-cta-card glass-panel" onClick={() => setActivePortal('live_auction_gate')} style={{ borderColor: 'rgba(255,215,0,0.3)', cursor: 'pointer' }}>
                      <span className="cta-icon">🏟️</span>
                      <h3 className="sporty-title text-gold">Captains Bidding Lobby</h3>
                      <p className="text-secondary text-xs">Enter the live bidding arena as {authState.teamName}</p>
                      <button className="btn-premium btn-gold btn-sm" style={{ marginTop: '12px' }}>Enter Lobby →</button>
                    </div>
                  )}
                </div>
              ) : (
                /* Pre-login hero - 4 clear options */
                <div className="landing-cta-grid">
                  <div className="landing-cta-card glass-panel" onClick={() => setActivePortal('auc_login')} style={{ borderColor: 'rgba(255,215,0,0.3)', cursor: 'pointer' }}>
                    <span className="cta-icon">🔑</span>
                    <h3 className="sporty-title text-gold">Login as Auctioneer</h3>
                    <p className="text-secondary text-xs">Access your registered admin console to manage the tournament</p>
                    <button className="btn-premium btn-gold btn-sm" style={{ marginTop: '12px' }}>Login Now →</button>
                  </div>
                  <div className="landing-cta-card glass-panel" onClick={() => setActivePortal('auc_register')} style={{ cursor: 'pointer' }}>
                    <span className="cta-icon">📝</span>
                    <h3 className="sporty-title">Register as Auctioneer</h3>
                    <p className="text-secondary text-xs">Set up a new auctioneer profile and configure your tournament</p>
                    <button className="btn-premium btn-secondary btn-sm" style={{ marginTop: '12px' }}>Register →</button>
                  </div>
                  <div className="landing-cta-card glass-panel" onClick={() => setActivePortal('live_auction_gate')} style={{ borderColor: 'rgba(255,215,0,0.3)', cursor: 'pointer' }}>
                    <span className="cta-icon">🏟️</span>
                    <h3 className="sporty-title text-gold">Captain Login</h3>
                    <p className="text-secondary text-xs">Enter the live bidding arena as a captain</p>
                    <button className="btn-premium btn-gold btn-sm" style={{ marginTop: '12px' }}>Enter Lobby →</button>
                  </div>
                  <div className="landing-cta-card glass-panel" onClick={() => setActivePortal('player_register')} style={{ cursor: 'pointer' }}>
                    <span className="cta-icon">🏃</span>
                    <h3 className="sporty-title">Join Draft Pool</h3>
                    <p className="text-secondary text-xs">Register as a player to enter the live drafting auction pool</p>
                    <button className="btn-premium btn-secondary btn-sm" style={{ marginTop: '12px' }}>Join Now →</button>
                  </div>
                </div>
              )}
            </div>

            {/* MVP Banner on Landing Page — shown when auction is complete */}
            {(() => {
              const soldPlayers = db.players.filter(p => p.status === 'sold');
              const pendingPlayers = db.players.filter(p => p.status === 'approved' || p.status === 'active');
              const auctionDone = soldPlayers.length > 0 && pendingPlayers.length === 0;
              if (!auctionDone) return null;
              const mvp = soldPlayers.reduce((best, p) => (!best || p.soldPrice > best.soldPrice) ? p : best, null);
              const mvpTeam = mvp ? db.teams.find(t => t.id === mvp.soldToTeamId) : null;
              return (
                <div style={{ width: '100%', marginTop: '32px' }}>
                  <MVPShowcase mvpPlayer={mvp} mvpTeam={mvpTeam} renderAvatarSVG={renderAvatarSVG} formatCurrency={formatCurrency} />
                </div>
              );
            })()}

            {/* About Section */}
            <div className="about-section glass-panel margin-t-40" style={{ padding: '40px', borderRadius: '20px', width: '100%' }}>
              <h2 className="sporty-title text-gold text-center margin-b-30" style={{ fontSize: '1.6rem', letterSpacing: '1.5px' }}>🏟️ SYSTEM FEATURES</h2>
              <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="about-card glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                  <h3 className="sporty-title text-sm text-gold">🎙️ Admin Console</h3>
                  <p className="text-secondary text-xs margin-t-8" style={{ lineHeight: '1.5' }}>
                    Auctioneers enjoy granular control over active bidding wars, timing, approving player pool requests, and finalizing squad declarations.
                  </p>
                </div>
                <div className="about-card glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                  <h3 className="sporty-title text-sm text-gold">⚡ Live Bidding</h3>
                  <p className="text-secondary text-xs margin-t-8" style={{ lineHeight: '1.5' }}>
                    Captains participate using dedicated bid sockets. Bids, countdown states, and transaction histories synchronize immediately.
                  </p>
                </div>
                <div className="about-card glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                  <h3 className="sporty-title text-sm text-gold">📊 Squad Operations</h3>
                  <p className="text-secondary text-xs margin-t-8" style={{ lineHeight: '1.5' }}>
                    Roster balances update instantly with transaction fees deducted from individual starting budgets after winning players.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Spectator shortcut */}
            <div className="text-center margin-t-30" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <p className="text-secondary text-xs">
                Just want to watch the tournament?{' '}
                <span className="text-gold font-bold pointer" style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setActivePortal('squad_showcase')}>
                  Open Spectator Squad Board 📋
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ── VIEW: LOGIN AS AUCTIONEER ── */}
        {activePortal === 'auc_login' && (
          <div className="auth-portal-page animate-fade-in">
            <div className="auth-portal-hero">
              <div className="auth-portal-icon">🔑</div>
              <h1 className="sporty-title glow-text-gold">AUCTIONEER LOGIN</h1>
              <p className="hero-subtitle" style={{ marginBottom: 0 }}>Access your admin console with your registered credentials.</p>
            </div>

            <div className="auth-card glass-panel flex-column" style={{ maxWidth: '460px', margin: '32px auto 0 auto', padding: '36px', borderRadius: '24px', border: '1px solid rgba(255,215,0,0.2)' }}>
              {/* Show register link if no auctioneer registered */}
              {!db.auctioneerRegistered ? (
                <div className="text-center flex-column gap-16" style={{ padding: '20px 0' }}>
                  <span style={{ fontSize: '2.5rem' }}>📋</span>
                  <h3 className="sporty-title text-gold">No Auctioneer Registered Yet</h3>
                  <p className="text-secondary text-sm">You need to register an auctioneer profile before you can log in.</p>
                  <button
                    className="btn-premium btn-gold"
                    onClick={() => setActivePortal('auc_register')}
                    style={{ padding: '12px 24px' }}
                  >
                    Register as Auctioneer 📝
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="sporty-title text-gold text-center" style={{ fontSize: '1.3rem', marginBottom: '24px' }}>SIGN IN TO CONSOLE</h2>
                  <form onSubmit={handleAuctioneerLogin} className="auth-form flex-column gap-16">
                    <div className="form-group text-left">
                      <label className="text-xs">Auctioneer Login ID</label>
                      <input
                        type="text"
                        className="input-premium"
                        placeholder="e.g. admin"
                        value={aucIdInput}
                        onChange={(e) => { setAucIdInput(e.target.value); clearAuthError(); }}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="form-group text-left">
                      <label className="text-xs">Access Password</label>
                      <input
                        type="password"
                        className="input-premium"
                        placeholder="••••••"
                        value={aucPasswordInput}
                        onChange={(e) => { setAucPasswordInput(e.target.value); clearAuthError(); }}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-premium btn-gold" style={{ marginTop: '8px', padding: '14px', fontSize: '1rem', letterSpacing: '0.5px' }}>
                      Authorize & Enter Console ⚡
                    </button>
                  </form>

                  <div className="or-divider" style={{ margin: '20px 0' }}><span>or</span></div>
                  <p className="text-center text-secondary text-xs">
                    Not registered yet?{' '}
                    <span
                      className="text-gold font-bold"
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setActivePortal('auc_register')}
                    >
                      Register as Auctioneer
                    </span>
                  </p>
                </>
              )}
            </div>
            <div className="text-center margin-t-20">
              <button className="btn-premium btn-secondary btn-sm" onClick={() => setActivePortal('landing')}>
                ← Back to Home
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW: REGISTER AS AUCTIONEER ── */}
        {activePortal === 'auc_register' && (
          <div className="auth-portal-page animate-fade-in">
            <div className="auth-portal-hero">
              <div className="auth-portal-icon">📝</div>
              <h1 className="sporty-title glow-text-gold">REGISTER AS AUCTIONEER</h1>
              <p className="hero-subtitle" style={{ marginBottom: 0 }}>Create your admin profile to set up and manage your cricket auction tournament.</p>
            </div>

            {db.auctioneerRegistered ? (
              <div className="auth-card glass-panel flex-column text-center" style={{ maxWidth: '460px', margin: '32px auto 0 auto', padding: '36px', borderRadius: '24px', border: '1px solid rgba(255,215,0,0.2)', gap: '16px' }}>
                <span style={{ fontSize: '3rem' }}>✅</span>
                <h3 className="sporty-title text-gold">Already Registered!</h3>
                <p className="text-secondary text-sm">An auctioneer profile already exists. Please log in with your credentials.</p>
                <button className="btn-premium btn-gold" onClick={() => setActivePortal('auc_login')} style={{ padding: '12px 24px' }}>
                  Go to Login 🔑
                </button>
              </div>
            ) : (
              <div className="auth-card glass-panel flex-column" style={{ maxWidth: '480px', margin: '32px auto 0 auto', padding: '36px', borderRadius: '24px', border: '1px solid rgba(255,215,0,0.15)' }}>
                <h2 className="sporty-title text-gold text-center" style={{ fontSize: '1.3rem', marginBottom: '24px' }}>CREATE ADMIN PROFILE</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!registerForm.auctioneerName.trim() || !registerForm.auctioneerId.trim() || !registerForm.auctioneerPassword.trim()) {
                      alert('Please fill in all details.');
                      return;
                    }
                    if (!setupForm.tournamentName.trim()) {
                      alert('Please enter an auction name.');
                      return;
                    }
                    registerAuctioneer({
                      ...registerForm,
                      auctioneerId: registerForm.auctioneerId.trim(),
                      auctioneerPassword: registerForm.auctioneerPassword.trim(),
                      tournamentName: setupForm.tournamentName.trim()
                    });
                    setActivePortal('auc_login');
                  }}
                  className="auth-form flex-column gap-16"
                >
                  <div className="form-group text-left">
                    <label className="text-xs">Your Full Name</label>
                    <input type="text" className="input-premium" placeholder="e.g. Suman Sahoo" value={registerForm.auctioneerName} onChange={e => setRegisterForm({...registerForm, auctioneerName: e.target.value})} required autoFocus />
                  </div>
                  <div className="form-group text-left">
                    <label className="text-xs">Admin Login ID</label>
                    <input type="text" className="input-premium" placeholder="e.g. admin" value={registerForm.auctioneerId} onChange={e => setRegisterForm({...registerForm, auctioneerId: e.target.value})} required />
                  </div>
                  <div className="form-group text-left">
                    <label className="text-xs">Password</label>
                    <input type="password" className="input-premium" placeholder="Set a secure password" value={registerForm.auctioneerPassword} onChange={e => setRegisterForm({...registerForm, auctioneerPassword: e.target.value})} required />
                  </div>
                  <div className="form-group text-left">
                    <label className="text-xs">Auction Name</label>
                    <input type="text" className="input-premium" placeholder="e.g. IPL Auction 2025" value={setupForm.tournamentName} onChange={e => setSetupForm({...setupForm, tournamentName: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn-premium btn-gold" style={{ padding: '14px', fontSize: '1rem', marginTop: '8px', letterSpacing: '0.5px' }}>
                    Register & Continue 🏆
                  </button>
                </form>

                <div className="or-divider" style={{ margin: '20px 0' }}><span>or</span></div>
                <p className="text-center text-secondary text-xs">
                  Already registered?{' '}
                  <span className="text-gold font-bold" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActivePortal('auc_login')}>
                    Login as Auctioneer
                  </span>
                </p>
              </div>
            )}
            <div className="text-center margin-t-20">
              <button className="btn-premium btn-secondary btn-sm" onClick={() => setActivePortal('landing')}>
                ← Back to Home
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 2: AUCTIONEER PORTAL ── */}
        {activePortal === 'auctioneer' && (
          <div>
            {authState.authenticated && authState.role === 'auctioneer' ? (
              db.setupComplete ? (
                /* AUCTIONEER IS LOGGED IN & SETUP COMPLETE: DISPLAY CONTROL CONSOLE */
                <div className="auctioneer-dashboard-container flex-column gap-16" style={{ width: '100%' }}>
                {/* Elegant Sub-navigation Tab Bar */}
                <div className="auctioneer-tab-bar glass-panel flex-center gap-12" style={{ padding: '8px', borderRadius: '16px', display: 'flex', gap: '8px', width: 'fit-content', margin: '0 auto 20px auto', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
                  <button 
                    className={`btn-premium btn-sm ${auctioneerTab === 'live' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setAuctioneerTab('live')}
                    style={{ minWidth: '180px', padding: '10px 20px', fontWeight: 'bold', borderRadius: '10px' }}
                  >
                    🔨 Live Auction Desk
                  </button>
                  <button 
                    className={`btn-premium btn-sm ${auctioneerTab === 'management' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setAuctioneerTab('management')}
                    style={{ minWidth: '180px', padding: '10px 20px', fontWeight: 'bold', borderRadius: '10px' }}
                  >
                    📋 Roster & Squad Manager
                  </button>
                  <button 
                    className={`btn-premium btn-sm ${auctioneerTab === 'pitch' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setAuctioneerTab('pitch')}
                    style={{ minWidth: '180px', padding: '10px 20px', fontWeight: 'bold', borderRadius: '10px' }}
                  >
                    🏏 Field & Playing XI
                  </button>
                </div>

                {auctioneerTab === 'live' ? (
                  /* ── TAB 1: LIVE AUCTION DESK ── */
                  <div className="dashboard-grid single-focus-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
                    {!db.setupComplete && (
                      <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: '16px', border: '1px solid rgba(251,192,45,0.3)', background: 'linear-gradient(135deg, #1a1500 0%, #1c1200 100%)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '2.5rem', flexShrink: 0 }}>⚙️</span>
                        <div style={{ flex: 1 }}>
                          <h3 className="sporty-title glow-text-gold" style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>TOURNAMENT NOT CONFIGURED YET</h3>
                          <p className="text-secondary" style={{ margin: '0 0 14px 0', fontSize: '0.85rem' }}>You need to set up your tournament before the live auction desk becomes available.</p>
                          <button className="btn-premium btn-gold btn-sm" onClick={() => setAuctioneerTab('management')}>
                            🚀 Go to Setup Console
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex-column gap-20">
                      
                      {/* Real-time Bidding Panel */}
                      <section className="glass-panel section-padding relative-pos">
                        <div className="flex-between section-header border-bottom">
                          <h2 className="sporty-title glow-text-gold flex-center gap-8">
                            <span className="live-dot"></span> LIVE AUCTION CONTROL
                          </h2>
                          {db.auctionState.status !== 'idle' && (
                            <div className="live-badge sporty-title animate-pulse-red">
                              {db.auctionState.status.toUpperCase()}
                            </div>
                          )}
                        </div>

                        {activePlayer ? (
                          <div className="live-auctioneer-grid">
                            {/* Active Player Card details */}
                            <div className="active-player-showcase glass-panel flex-center flex-column relative-pos">
                              {db.auctionState.status === 'sold' && (
                                <div className="sold-stamp">SOLD</div>
                              )}
                              {db.auctionState.status === 'unsold' && (
                                <div className="stamp-unsold-overlay">UNSOLD</div>
                              )}
                              <div className="showcase-avatar">
                                {renderAvatarSVG(activePlayer.avatarPreset, activePlayer.avatarUrl)}
                              </div>
                              <h3 className="sporty-title">{activePlayer.name}</h3>
                              <span className={`badge-role badge-${activePlayer.role.toLowerCase().replace('-', '')}`}>
                                {activePlayer.role}
                              </span>
                              
                              <div className="player-stats-strip flex-center gap-12">
                                <div>
                                  <span className="stat-label">Batting: </span>
                                  <span className="stat-value">{activePlayer.battingStyle}</span>
                                </div>
                                <div>
                                  <span className="stat-label">Bowling: </span>
                                  <span className="stat-value">{activePlayer.bowlingStyle}</span>
                                </div>
                              </div>

                              <div className="price-tag glass-panel">
                                <span className="label">Base Price: </span>
                                <span className="val glow-text-green">{formatCurrency(activePlayer.basePrice)}</span>
                              </div>
                            </div>

                            {/* Live Bid Status & Controls */}
                            <div className="live-bid-controls flex-column justify-between gap-16">
                              <div className="live-scoreboard glass-panel flex-column gap-8">
                                <div className="flex-between">
                                  <span className="text-secondary">Current Bid:</span>
                                  <span className="bid-amount glow-text-gold">{formatCurrency(db.auctionState.currentBid)}</span>
                                </div>
                                <div className="flex-between">
                                  <span className="text-secondary">Highest Bidder:</span>
                                  <span className="bidder-name text-green">
                                    {activeBidderTeam ? `${activeBidderTeam.name} (${activeBidderTeam.captain})` : "No Bids Yet"}
                                  </span>
                                </div>

                                {/* Countdown Timer Display */}
                                <div className="flex-center flex-column timer-box">
                                  <span className="text-muted uppercase text-xs">TIME REMAINING</span>
                                  <div className={`countdown-clock sporty-title ${db.auctionState.timeLeft <= 5 ? 'danger-timer animate-pulse-red' : 'glow-text-green'}`}>
                                    {db.auctionState.timeLeft}s
                                  </div>
                                  <div className="timer-bar-container">
                                    <div 
                                      className={`timer-bar ${db.auctionState.timeLeft <= 5 ? 'bg-red' : 'bg-green'}`} 
                                      style={{ width: `${(db.auctionState.timeLeft / (db.tournament?.timerSeconds || 30)) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              {/* Control Panel Buttons */}
                              <div className="action-buttons-group">
                                <button 
                                  className={`btn-premium ${db.auctionState.status === 'bidding' ? 'btn-danger btn-danger-hover' : 'btn-gold'}`} 
                                  onClick={toggleBiddingTimer}
                                >
                                  {db.auctionState.status === 'bidding' ? "⏸️ Pause Clock" : "▶️ Start/Resume Timer"}
                                </button>
                                
                                <div className="flex-center gap-12">
                                  <button 
                                    className="btn-premium btn-gold btn-full btn-xs" 
                                    disabled={!activeBidderTeam} 
                                    onClick={handleDeclareSold}
                                  >
                                    🔨 Declare Sold
                                  </button>
                                  <button 
                                    className="btn-premium btn-secondary btn-full btn-xs btn-danger-hover" 
                                    onClick={handleDeclareUnsold}
                                  >
                                    ❌ Declare Unsold
                                  </button>
                                </div>
                              </div>

                              {/* Bid on Behalf of Team (Local/Solo Mode) */}
                              {mode === 'local' && db.auctionState.status === 'bidding' && (
                                <div className="glass-panel" style={{ padding: '12px', border: '1px solid rgba(255, 215, 0, 0.2)', background: 'rgba(255, 215, 0, 0.02)', marginTop: '8px', borderRadius: '12px' }}>
                                  <span className="text-secondary text-xs uppercase" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'center' }}>
                                    📢 Bid on Behalf of Team
                                  </span>
                                  <div className="flex-wrap gap-8" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {db.teams.map(t => {
                                      const increment = db.tournament ? db.tournament.minBidIncrement : 50000;
                                      const nextBid = db.auctionState.highestBidderId ? (db.auctionState.currentBid + increment) : db.auctionState.currentBid;
                                      const hasBudget = t.budget >= nextBid;
                                      const isHighest = db.auctionState.highestBidderId === t.id;
                                      return (
                                        <button
                                          key={t.id}
                                          className="btn-premium btn-xs"
                                          style={{
                                            fontSize: '0.75rem',
                                            padding: '6px 10px',
                                            background: isHighest ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                            borderColor: isHighest ? 'var(--grass-glow)' : 'var(--glass-border)',
                                            opacity: (!hasBudget || isHighest) ? 0.6 : 1,
                                            cursor: (!hasBudget || isHighest) ? 'not-allowed' : 'pointer',
                                            borderRadius: '8px'
                                          }}
                                          disabled={!hasBudget || isHighest}
                                          onClick={() => placeBid(t.id)}
                                        >
                                          {t.name} (₹{formatShortCurrency(nextBid)})
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="lobby-empty-card flex-center flex-column section-padding glass-panel">
                            <div className="icon">🏟️</div>
                            <h3 className="sporty-title">No Active Player</h3>
                            <p>Start drafting by choosing a player from the approved backup roster pool under the "Roster & Squad Manager" tab.</p>
                          </div>
                        )}

                        {/* Bidding log */}
                        {db.auctionState.bidHistory.length > 0 && (
                          <div className="live-history-logs glass-panel">
                            <span className="log-heading sporty-title">Live Bidding Logs</span>
                            <div className="logs-scroller">
                              {db.auctionState.bidHistory.map((log, idx) => (
                                <div key={idx} className="log-row flex-between">
                                  <span className="log-team glow-text-gold">{log.teamName}</span>
                                  <span className="log-cap text-secondary">({log.captain})</span>
                                  <span className="log-amount text-green">{formatCurrency(log.bidAmount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>

                      {/* Management Code Box */}
                      {authState.auctioneerCode && (
                        <section className="glass-panel section-padding flex-between" style={{ background: 'rgba(255, 215, 0, 0.03)' }}>
                          <div>
                            <h3 className="sporty-title glow-text-gold">YOUR MANAGEMENT CODE</h3>
                            <p className="text-secondary text-sm">Use this code on another device or session to log in as the auctioneer.</p>
                          </div>
                          <div className="credential-box" style={{ margin: 0, padding: '8px 16px' }}>
                            <span className="cred-value small">{authState.auctioneerCode}</span>
                          </div>
                        </section>
                      )}

                    </div>
                  </div>
                ) : auctioneerTab === 'management' ? (
                  /* ── TAB 2: ROSTER & SQUAD MANAGER ── */
                  <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* Left Column: Invite Link, Approvals, Add Squad */}
                    <div className="left-column flex-column gap-20">
                      
                      {/* Invite Link */}
                      <section className="glass-panel section-padding invite-banner flex-between">
                        <div>
                          <h3 className="sporty-title glow-text-gold">ADD PLAYERS INVITE LINK</h3>
                          <p className="text-secondary text-sm">Generate player invitation links. Shared players can instantly fill out their profiles.</p>
                        </div>
                        <button className="btn-premium btn-gold btn-sm" onClick={copyInviteLink}>
                          Copy Registration Link 🔗
                        </button>
                      </section>

                      {/* Approvals */}
                      <section className="glass-panel section-padding flex-column gap-16">
                        <span className="section-subheader border-bottom">
                          PENDING PLAYER APPROVALS <span className="badge-count">{db.players.filter(p => p.status === 'registered' || p.status === 'pending').length}</span>
                        </span>

                        <div className="approvals-stack flex-column gap-12">
                          {db.players.filter(p => p.status === 'registered' || p.status === 'pending').length === 0 ? (
                            <p className="empty-info-msg">No pending registrations. Share the registration link to register players.</p>
                          ) : (
                            db.players.filter(p => p.status === 'registered' || p.status === 'pending').map(player => (
                              <div key={player.id} className="approval-card glass-panel flex-between flex-wrap gap-12">
                                <div className="flex-center gap-12">
                                  <div className="mini-avatar">
                                    {renderAvatarSVG(player.avatarPreset, player.avatarUrl)}
                                  </div>
                                  <div>
                                    <h4 className="player-name-bold">{player.name}</h4>
                                    <span className={`badge-role badge-${player.role.toLowerCase().replace('-', '')}`}>
                                      {player.role}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex-center gap-8">
                                  <input 
                                    type="number" 
                                    className="input-premium input-xs width-140" 
                                    placeholder="Base Price (₹)"
                                    value={priceAllocation[player.id] || ''}
                                    onChange={e => setPriceAllocation({ ...priceAllocation, [player.id]: e.target.value })}
                                  />
                                  <button 
                                    className="btn-premium btn-gold btn-xs"
                                    onClick={() => {
                                      const basePrice = Number(priceAllocation[player.id]);
                                      if (!basePrice || basePrice <= 0) {
                                        alert("Please enter a valid base price!");
                                        return;
                                      }
                                      allocatePriceAndApprove(player.id, basePrice);
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    className="btn-premium btn-secondary btn-xs btn-danger-hover"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to reject and remove ${player.name}?`)) {
                                        rejectPlayer(player.id);
                                      }
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </section>

                      {/* Manage Squads */}
                      <section className="glass-panel section-padding">
                        <span className="section-subheader border-bottom">MANAGE SQUADS & CREDS</span>
                        
                        <form onSubmit={handleAddTeamSubmit} className="add-team-form flex-column gap-12 margin-t-12">
                          <div className="form-group">
                            <input 
                              type="text" 
                              className="input-premium input-sm" 
                              placeholder="Team Name" 
                              value={teamForm.name}
                              onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                              required 
                            />
                          </div>
                          <div className="form-group">
                            <input 
                              type="text" 
                              className="input-premium input-sm" 
                              placeholder="Captain Name" 
                              value={teamForm.captain}
                              onChange={e => setTeamForm({ ...teamForm, captain: e.target.value })}
                              required 
                            />
                          </div>
                          <div className="form-group">
                            <input 
                              type="number" 
                              className="input-premium input-sm" 
                              placeholder={`Budget (Default: ${formatCurrency(db.tournament?.startingBudget || 80000000)})`}
                              value={teamForm.budget}
                              onChange={e => setTeamForm({ ...teamForm, budget: e.target.value })}
                            />
                          </div>
                          <button type="submit" className="btn-premium btn-gold btn-sm">
                            Add Team to League 🚀
                          </button>
                        </form>

                        <div className="teams-list flex-column gap-12 margin-t-16">
                          {db.teams.length === 0 ? (
                            <p className="empty-info-msg">No teams configured. Enter names above to initialize team credentials.</p>
                          ) : (
                            db.teams.map(team => (
                              <div key={team.id} className="team-glass-card glass-panel flex-column gap-8">
                                <div className="team-header flex-between">
                                  <div>
                                    <h4>{team.name}</h4>
                                    <span className="text-secondary text-xxs">Leader: {team.captain}</span>
                                  </div>
                                  <button className="delete-team-btn" onClick={() => deleteTeam(team.id)}>❌</button>
                                </div>

                                <div className="team-cred-inline">
                                  <div className="cred-mini">
                                    <span className="lbl">Team ID</span>
                                    <span className="val">{team.loginId}</span>
                                  </div>
                                  <div className="cred-mini">
                                    <span className="lbl">Password</span>
                                    <span className="val">{team.loginPassword}</span>
                                  </div>
                                </div>

                                <div className="team-budget-bar flex-column">
                                  <div className="flex-between text-xxs text-secondary">
                                    <span>Remaining Budget</span>
                                    <span>{formatCurrency(team.budget)}</span>
                                  </div>
                                  <div className="budget-bar-track">
                                    <div 
                                      className="budget-bar-fill bg-gold" 
                                      style={{ width: `${(team.budget / (db.tournament?.startingBudget || team.budget || 1)) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="team-roster border-top flex-column">
                                  <span className="text-xxs text-muted font-bold">ROSTER SQUAD:</span>
                                  <div className="squad-mini-grid flex-center flex-wrap gap-4">
                                    {db.players.filter(p => p.soldToTeamId === team.id).map(player => (
                                      <div key={player.id} className="squad-badge flex-center gap-4 text-xxs truncate">
                                        <div className="mini-avatar-tiny">
                                          {renderAvatarSVG(player.avatarPreset, player.avatarUrl)}
                                        </div>
                                        <span className="truncate">{player.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </section>

                    </div>

                    {/* Right Column: Approved Pool */}
                    <div className="right-column flex-column gap-20">
                      <section className="glass-panel section-padding" style={{ height: '100%' }}>
                        <span className="section-subheader border-bottom">
                          DRAFT ROSTER POOL <span className="badge-count">{db.players.filter(p => p.status !== 'registered' && p.status !== 'pending').length}</span>
                        </span>

                        <div className="roster-pool-list flex-column gap-12 margin-t-16" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                          {db.players.filter(p => p.status !== 'registered' && p.status !== 'pending').length === 0 ? (
                            <p className="empty-info-msg">No players registered or approved yet.</p>
                          ) : (
                            db.players.filter(p => p.status !== 'registered' && p.status !== 'pending').map(player => (
                              <div key={player.id} className="player-grid-card glass-panel flex-column justify-between relative-pos" style={{ minHeight: 'auto', padding: '12px' }}>
                                
                                {player.status === 'sold' && <span className="mini-stamp sold">SOLD</span>}
                                {player.status === 'unsold' && <span className="mini-stamp unsold">UNSOLD</span>}
                                {player.status === 'active' && <span className="mini-stamp active">ACTIVE</span>}

                                <div className="flex-center gap-8 justify-start">
                                  <div className="mini-avatar">
                                    {renderAvatarSVG(player.avatarPreset, player.avatarUrl)}
                                  </div>
                                  <div>
                                    <h4 className="player-title-bold text-sm">{player.name}</h4>
                                    <span className={`badge-role text-xxs badge-${player.role.toLowerCase().replace('-', '')}`}>
                                      {player.role}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex-between margin-t-8 border-top" style={{ paddingTop: '6px' }}>
                                  <span className="text-xxs text-secondary">Base: {formatCurrency(player.basePrice)}</span>
                                  {player.status === 'sold' && (
                                    <span className="text-xxs text-gold font-bold">Sold: {formatCurrency(player.soldPrice)}</span>
                                  )}
                                </div>

                                {(player.status === 'approved' || player.status === 'unsold') && (
                                  <div className="flex-column gap-6 margin-t-8 width-full">
                                    <button 
                                      className="btn-premium btn-gold btn-sm width-full"
                                      onClick={() => startAuctionForPlayer(player.id)}
                                    >
                                      🚀 Put Under Hammer
                                    </button>
                                    <div className="flex-center gap-6 width-full">
                                      <button 
                                        className="btn-premium btn-secondary btn-xs btn-full"
                                        onClick={() => {
                                          const newPrice = prompt(`Enter new base price for ${player.name}:`, player.basePrice);
                                          if (newPrice !== null) {
                                            const parsed = Number(newPrice);
                                            if (isNaN(parsed) || parsed <= 0) {
                                              alert("Please enter a valid base price.");
                                            } else {
                                              allocatePriceAndApprove(player.id, parsed);
                                            }
                                          }
                                        }}
                                      >
                                        ✏️ Edit Price
                                      </button>
                                      <button 
                                        className="btn-premium btn-secondary btn-xs btn-danger-hover btn-full"
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to remove ${player.name}?`)) {
                                            rejectPlayer(player.id);
                                          }
                                        }}
                                      >
                                        🗑️ Remove
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </section>
                    </div>

                  </div>
                ) : (
                  /* ── TAB 3: FIELD & PLAYING XI PITCH ── */
                  <div className="squad-pitch-container glass-panel animate-fade-in flex-column gap-20" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                    <RosterShowcasePitch
                      db={db}
                      authState={authState}
                      selectedTeamId={selectedShowcaseTeamId}
                      setSelectedTeamId={setSelectedShowcaseTeamId}
                      togglePlaying11={togglePlaying11}
                      renderAvatarSVG={renderAvatarSVG}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* AUCTIONEER IS LOGGED IN & SETUP NOT COMPLETE: RENDER SETUP CARD DIRECTLY */
              <div className="setup-summary-panel glass-panel animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div className="setup-hero">
                  <h2 className="sporty-title glow-text-gold">TOURNAMENT SETUP CONSOLE</h2>
                  <p className="text-secondary">Configure base parameters and pre-register squads to launch the stadium auction.</p>
                </div>

                <main className="registration-grid" style={{ gap: '20px', padding: '10px' }}>
                  {/* Left Column */}
                  <div className="flex-column gap-20">
                    <div className="form-section-card">
                      <h3 className="sporty-title text-gold" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>🏆 VARIABLES</h3>
                      <div className="setup-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="text-xs">Tournament Name</label>
                          <input type="text" className="input-premium" value={setupForm.tournamentName} onChange={e => setSetupForm({...setupForm, tournamentName: e.target.value})} required />
                        </div>
                        <div className="form-group">
                          <label className="text-xs">Auctioneer Name</label>
                          <input type="text" className="input-premium" value={setupForm.auctioneerName} onChange={e => setSetupForm({...setupForm, auctioneerName: e.target.value})} required />
                        </div>
                        <div className="form-group">
                          <label className="text-xs">Gender</label>
                          <select className="input-premium" value={setupForm.gender} onChange={e => setSetupForm({...setupForm, gender: e.target.value})}>
                            <option value="Men">Men's Tournament</option>
                            <option value="Women">Women's Tournament</option>
                            <option value="Mixed">Mixed League</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="text-xs">Budget (₹)</label>
                          <input type="number" className="input-premium" value={setupForm.startingBudget} onChange={e => {
                            const val = Number(e.target.value);
                            setSetupForm({...setupForm, startingBudget: val});
                            setSetupTeams(setupTeams.map(t => ({...t, budget: val})));
                          }} required />
                        </div>
                        <div className="form-group">
                          <label className="text-xs">Increment (₹)</label>
                          <input type="number" className="input-premium" value={setupForm.minBidIncrement} onChange={e => setSetupForm({...setupForm, minBidIncrement: Number(e.target.value)})} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="text-xs">Timer (sec)</label>
                          <input type="number" className="input-premium" value={setupForm.timerSeconds} onChange={e => setSetupForm({...setupForm, timerSeconds: Number(e.target.value)})} required />
                        </div>
                      </div>
                    </div>

                    <div className="form-section-card" style={{ borderLeft: '3px solid var(--gold-accent)' }}>
                      <h3 className="sporty-title text-gold" style={{ fontSize: '1.1rem', marginBottom: '10px' }}>🔑 ACCESS CREDENTIALS</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="text-xs">Admin ID</label>
                          <input type="text" className="input-premium font-bold text-gold" value={setupForm.auctioneerId} onChange={e => setSetupForm({...setupForm, auctioneerId: e.target.value})} required />
                        </div>
                        <div className="form-group">
                          <label className="text-xs">Password</label>
                          <input type="text" className="input-premium font-bold text-gold" value={setupForm.auctioneerPassword} onChange={e => setSetupForm({...setupForm, auctioneerPassword: e.target.value})} required />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex-column gap-20">
                    <div className="form-section-card">
                      <h3 className="sporty-title text-gold" style={{ fontSize: '1.1rem', marginBottom: '10px' }}>🏏 TEAM INITIALIZATION</h3>
                      <form onSubmit={addTeamToSetup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <input type="text" className="input-premium input-sm" placeholder="Franchise Name" value={tempTeam.name} onChange={e => setTempTeam({...tempTeam, name: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <input type="text" className="input-premium input-sm" placeholder="Captain Name" value={tempTeam.captain} onChange={e => setTempTeam({...tempTeam, captain: e.target.value})} />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <button type="submit" className="btn-premium btn-secondary btn-sm width-full">+ Credentials</button>
                        </div>
                      </form>

                      <h4 className="sporty-title text-xs text-secondary" style={{ marginBottom: '8px' }}>CONFIGURED SQUADS ({setupTeams.length})</h4>
                      {setupTeams.length === 0 ? (
                        <div className="text-center text-muted padding-20 text-xs italic" style={{ border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                          No franchises pre-registered.
                        </div>
                      ) : (
                        <div className="squads-setup-list" style={{ maxHeight: '200px' }}>
                          {setupTeams.map((team, idx) => (
                            <div key={idx} className="setup-team-row" style={{ padding: '8px 12px', marginBottom: '6px' }}>
                              <div className="setup-team-info">
                                <h4 style={{ fontSize: '0.85rem' }}>{team.name}</h4>
                                <div className="setup-cred-badge-inline" style={{ marginTop: '2px' }}>
                                  <div className="setup-cred-badge" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>ID: {team.loginId}</div>
                                  <div className="setup-cred-badge" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>PASS: {team.loginPassword}</div>
                                </div>
                              </div>
                              <button type="button" className="btn-remove-setup-team text-red" onClick={() => removeTeamFromSetup(idx)}>❌</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button onClick={handleSetupSubmit} className="btn-premium btn-gold btn-large font-bold" style={{ padding: '16px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 0 20px var(--gold-glow)' }}>
                      Launch Auction Stadium 🚀
                    </button>
                  </div>
                </main>
              </div>
            )
          ) : (
            /* NOT LOGGED IN AS AUCTIONEER: Show authentication required screen */
            <div className="pending-state-card glass-panel" style={{ maxWidth: '550px', margin: '40px auto', textAlign: 'center', gap: '20px' }}>
              <div className="icon">🔑</div>
              <h3 className="sporty-title glow-text-gold">AUCTIONEER ACCESS REQUIRED</h3>
              <p className="text-secondary text-sm">Please log in with your administrative credentials to access the console.</p>
              <button className="btn-premium btn-gold" onClick={() => setActivePortal('auc_login')}>
                Go to Login 🔑
              </button>
            </div>
            )}
          </div>
        )}

        {/* ── VIEW 3: LIVE AUCTION GATE / CAPTAINS LOBBY ── */}
        {activePortal === 'live_auction_gate' && (
          <div>
            {authState.authenticated && authState.role === 'team' ? (
              /* CAPTAIN IS LOGGED IN: DISPLAY CAPTAIN DASHBOARD */
              <div className="captain-dashboard-container flex-column gap-16" style={{ width: '100%' }}>
                {/* Captain Dashboard Sub-navigation Tabs */}
                <div className="captain-tab-bar glass-panel flex-center gap-12" style={{ padding: '8px', borderRadius: '16px', display: 'flex', gap: '8px', width: 'fit-content', margin: '0 auto 20px auto', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
                  <button 
                    className={`btn-premium btn-sm ${captainTab === 'live' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setCaptainTab('live')}
                    style={{ minWidth: '180px', padding: '10px 20px', fontWeight: 'bold', borderRadius: '10px' }}
                  >
                    🔨 Live Bidding Lobby
                  </button>
                  <button 
                    className={`btn-premium btn-sm ${captainTab === 'pitch' ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => setCaptainTab('pitch')}
                    style={{ minWidth: '180px', padding: '10px 20px', fontWeight: 'bold', borderRadius: '10px' }}
                  >
                    🏏 Squad & Playing XI Pitch
                  </button>
                </div>

                {captainTab === 'live' ? (
                  <div className="dashboard-grid">
                    {/* Left Column: Bidding Lobby, Player Info & Timer */}
                    <div className="left-column flex-column gap-20">
                      <main className="glass-panel section-padding relative-pos">
                        
                        <div className="captain-login-header border-bottom">
                          <h2 className="sporty-title glow-text-gold">CAPTAIN BIDDING DESK</h2>
                          <p className="text-secondary text-xs">Access granted. Use the active terminal to participate in real-time drafting.</p>
                        </div>

                        {activePlayer ? (
                          (() => {
                            const representingTeam = db.teams.find(t => t.id === authState.teamId);
                            
                            // Calculate the next bid required
                            const increment = db.tournament ? db.tournament.minBidIncrement : 50000;
                            const nextBidAmount = db.auctionState.highestBidderId ? (db.auctionState.currentBid + increment) : db.auctionState.currentBid;
                            
                            // Check validation constraints
                            const hasBudget = representingTeam && representingTeam.budget >= nextBidAmount;
                            const alreadyHoldingBid = db.auctionState.highestBidderId === authState.teamId;
                            const isBiddingActive = db.auctionState.status === 'bidding';
                            const canBid = isBiddingActive && hasBudget && !alreadyHoldingBid;

                            let bidErrorReason = '';
                            if (!isBiddingActive) {
                              bidErrorReason = "Bidding timer is currently paused by the auctioneer.";
                            } else if (alreadyHoldingBid) {
                              bidErrorReason = "You currently hold the highest bid!";
                            } else if (!hasBudget) {
                              bidErrorReason = `Insufficient budget! Next bid requires ${formatCurrency(nextBidAmount)}, your balance is ${formatCurrency(representingTeam?.budget || 0)}.`;
                            }

                            return (
                              <div className="live-auctioneer-grid">
                                {/* Player info card */}
                                <div className="active-player-showcase glass-panel flex-center flex-column relative-pos">
                                  {db.auctionState.status === 'sold' && (
                                    <div className="sold-stamp">SOLD</div>
                                  )}
                                  {db.auctionState.status === 'unsold' && (
                                    <div className="stamp-unsold-overlay">UNSOLD</div>
                                  )}
                                  <div className="showcase-avatar">
                                    {renderAvatarSVG(activePlayer.avatarPreset, activePlayer.avatarUrl)}
                                  </div>
                                  <h3 className="sporty-title">{activePlayer.name}</h3>
                                  <span className={`badge-role badge-${activePlayer.role.toLowerCase().replace('-', '')}`}>
                                    {activePlayer.role}
                                  </span>
                                  
                                  <div className="player-stats-strip flex-center gap-12">
                                    <div>
                                      <span className="stat-label">Batting: </span>
                                      <span className="stat-value">{activePlayer.battingStyle}</span>
                                    </div>
                                    <div>
                                      <span className="stat-label">Bowling: </span>
                                      <span className="stat-value">{activePlayer.bowlingStyle}</span>
                                    </div>
                                  </div>

                                  <div className="price-tag glass-panel">
                                    <span className="label">Base Price: </span>
                                    <span className="val glow-text-green">{formatCurrency(activePlayer.basePrice)}</span>
                                  </div>
                                </div>

                                {/* Live Scores & CTA bidding button */}
                                <div className="live-bid-controls flex-column justify-between gap-16">
                                  
                                  <div className="live-scoreboard glass-panel flex-column gap-8 animate-pulse-glow">
                                    <div className="flex-between">
                                      <span className="text-secondary text-sm">Active Highest Bid:</span>
                                      <span className="bid-amount glow-text-gold">{formatCurrency(db.auctionState.currentBid)}</span>
                                    </div>
                                    <div className="flex-between">
                                      <span className="text-secondary text-sm">Highest Bidder:</span>
                                      <span className="bidder-name text-green font-bold">
                                        {activeBidderTeam ? `${activeBidderTeam.name}` : "No Bids Yet"}
                                      </span>
                                    </div>

                                    {/* Countdown Timer Display */}
                                    <div className="flex-center flex-column timer-box border-top">
                                      <span className="text-muted uppercase text-xxs">Countdown Timer</span>
                                      <div className={`countdown-clock sporty-title ${db.auctionState.timeLeft <= 5 ? 'danger-timer animate-pulse-red' : 'glow-text-green'}`}>
                                        {db.auctionState.timeLeft}s
                                      </div>
                                      <div className="timer-bar-container">
                                        <div 
                                          className={`timer-bar ${db.auctionState.timeLeft <= 5 ? 'bg-red' : 'bg-green'}`} 
                                          style={{ width: `${(db.auctionState.timeLeft / (db.tournament?.timerSeconds || 30)) * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Remaining Purse Preview — shown when bidding is active & captain can/could bid */}
                                  {isBiddingActive && representingTeam && !alreadyHoldingBid && (
                                    <div style={{
                                      background: 'rgba(0,0,0,0.35)',
                                      border: '1px solid rgba(255,215,0,0.2)',
                                      borderRadius: '14px',
                                      padding: '12px 16px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px'
                                    }}>
                                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
                                        💰 Purse After This Bid
                                      </span>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>Current Purse</span>
                                          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--green-accent)', fontFamily: 'monospace' }}>
                                            {formatCurrency(representingTeam.budget)}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.2)' }}>→</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>After Bid</span>
                                          <span style={{
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            fontFamily: 'monospace',
                                            color: (representingTeam.budget - nextBidAmount) < 0
                                              ? '#ff5252'
                                              : (representingTeam.budget - nextBidAmount) < nextBidAmount
                                                ? '#ffd700'
                                                : 'var(--green-accent)'
                                          }}>
                                            {(representingTeam.budget - nextBidAmount) >= 0
                                              ? formatCurrency(representingTeam.budget - nextBidAmount)
                                              : `–${formatCurrency(nextBidAmount - representingTeam.budget)}`}
                                          </span>
                                        </div>
                                      </div>
                                      {/* Visual budget depletion bar */}
                                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '6px', overflow: 'hidden', marginTop: '2px' }}>
                                        <div style={{
                                          height: '100%',
                                          borderRadius: '6px',
                                          width: `${Math.max(0, Math.min(100, ((representingTeam.budget - nextBidAmount) / (db.tournament?.startingBudget || representingTeam.budget)) * 100))}%`,
                                          background: (representingTeam.budget - nextBidAmount) < nextBidAmount
                                            ? 'linear-gradient(90deg, #ffd700, #ff9800)'
                                            : 'linear-gradient(90deg, #00e676, #00bcd4)',
                                          transition: 'width 0.4s ease'
                                        }} />
                                      </div>
                                      {(representingTeam.budget - nextBidAmount) < nextBidAmount && (representingTeam.budget - nextBidAmount) >= 0 && (
                                        <span style={{ fontSize: '0.62rem', color: '#ffd700', textAlign: 'center', marginTop: '2px' }}>
                                          ⚠️ Low purse warning — bid wisely!
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Bid Submit hammer CTA */}
                                  <div className="flex-column gap-8">
                                    <button 
                                      className={`btn-premium btn-gold btn-large animate-pulse-gold ${!canBid ? 'disabled' : ''}`}
                                      disabled={!canBid}
                                      onClick={() => placeBid()}
                                    >
                                      {alreadyHoldingBid ? (
                                        "🔥 YOU HOLD BID"
                                      ) : (
                                        `SUBMIT BID (${formatCurrency(nextBidAmount)}) 🔨`
                                      )}
                                    </button>
                                    
                                    {!canBid && bidErrorReason && (
                                      <span className="text-xs text-red text-center italic block">{bidErrorReason}</span>
                                    )}
                                  </div>

                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="lobby-empty-card flex-center flex-column section-padding glass-panel">
                            <div className="icon">🏟️</div>
                            <h3 className="sporty-title">Auction Lobby Waiting</h3>
                            <p>Currently no players are live under the hammer. Keep this tab open. The auctioneer will initiate bidding from the dashboard shortly.</p>
                          </div>
                        )}

                        {/* Bid history tracker logs */}
                        {db.auctionState.bidHistory.length > 0 && (
                          <div className="live-history-logs glass-panel">
                            <span className="log-heading sporty-title">Bidding Logs</span>
                            <div className="logs-scroller">
                              {db.auctionState.bidHistory.map((log, idx) => (
                                <div key={idx} className={`log-row flex-between ${log.teamId === authState.teamId ? 'my-team-bid' : ''}`}>
                                  <span className="log-team glow-text-gold">{log.teamName}</span>
                                  <span className="log-cap text-secondary">({log.captain})</span>
                                  <span className="log-amount text-green">{formatCurrency(log.bidAmount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </main>
                    </div>

                    {/* Right Column: Captain Team budget stats and roster */}
                    <div className="right-column flex-column gap-20">
                      {(() => {
                        const representingTeam = db.teams.find(t => t.id === authState.teamId);
                        if (!representingTeam) return null;

                        const squadList = db.players.filter(p => p.soldToTeamId === representingTeam.id);

                        return (
                          <section className="glass-panel section-padding flex-column gap-16">
                            <div className="border-bottom">
                              <span className="text-xs text-muted uppercase">CAPTAIN CONSOLE</span>
                              <h3 className="team-name sporty-title glow-text-gold">{representingTeam.name}</h3>
                              <span className="captain-tag text-xs text-secondary">Leader: {representingTeam.captain}</span>
                            </div>

                            <div className="budget-dashboard-card glass-panel flex-column gap-8">
                              <span className="text-xs text-muted uppercase">AVAILABLE BUDGET</span>
                              <span className="val text-green sporty-title text-xl font-bold">{formatCurrency(representingTeam.budget)}</span>
                              <div className="budget-bar-track">
                                <div 
                                  className="budget-bar-fill bg-green" 
                                  style={{ width: `${(representingTeam.budget / (db.tournament?.startingBudget || representingTeam.budget || 1)) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xxs text-secondary">Initial: {formatCurrency(db.tournament?.startingBudget || 0)}</span>
                            </div>

                            <div className="squad-details border-top">
                              <span className="section-subheader flex-between">
                                <span>YOUR ACQUIRED SQUAD</span>
                                <span className="badge-count bg-green">{squadList.length} Players</span>
                              </span>

                              {squadList.length === 0 ? (
                                <p className="empty-info-msg italic text-center">No players bought during active session yet.</p>
                              ) : (
                                <div className="squad-roster-rows flex-column gap-8 margin-t-12">
                                  {squadList.map(player => (
                                    <div key={player.id} className="squad-row-card glass-panel flex-between padding-8">
                                      <div className="flex-center gap-8">
                                        <div className="tiny-avatar">
                                          {renderAvatarSVG(player.avatarPreset, player.avatarUrl)}
                                        </div>
                                        <div>
                                          <h5 className="font-bold text-xs truncate max-width-120">{player.name}</h5>
                                          <span className="badge-role text-xxs padding-r-0">{player.role}</span>
                                        </div>
                                      </div>
                                      <span className="val text-gold text-xs font-bold">{formatCurrency(player.soldPrice)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </section>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  /* Captain's Pitch layout view */
                  <div className="squad-pitch-container glass-panel animate-fade-in flex-column gap-20" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                    <RosterShowcasePitch
                      db={db}
                      authState={authState}
                      selectedTeamId={authState.teamId} // Locked to captain's own team
                      setSelectedTeamId={() => {}} // No change allowed
                      togglePlaying11={togglePlaying11}
                      renderAvatarSVG={renderAvatarSVG}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                )}
              </div>
            ) : !db.setupComplete ? (
              /* PENDING SETUP WARNING */
              <div className="pending-state-card glass-panel animate-fade-in" style={{ maxWidth: '550px', margin: '40px auto', textAlign: 'center', gap: '20px' }}>
                <div className="icon">⏳</div>
                <h3 className="sporty-title glow-text-gold">Setup Pending</h3>
                <p className="text-secondary text-sm">
                  {authState.authenticated && authState.role === 'auctioneer' 
                    ? "The tournament configuration is currently pending setup. Please configure the tournament from the Admin Dashboard first."
                    : "The tournament configuration is currently pending setup. Please ask the Auctioneer to configure the tournament or register an admin account to start."}
                </p>
                <div className="flex-center gap-12" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                  <button className="btn-premium btn-secondary btn-sm" onClick={() => setActivePortal('landing')}>
                    Return to Home
                  </button>
                  {authState.authenticated && authState.role === 'auctioneer' && (
                    <button className="btn-premium btn-gold btn-sm" onClick={() => setActivePortal('auctioneer')}>
                      Admin Dashboard 🎙️
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* CAPTAIN IS NOT LOGGED IN: DISPLAY CAPTAIN LOGIN GATE */
              <div className="landing-page animate-fade-in text-center">
                <div className="landing-hero" style={{ paddingBottom: '20px' }}>
                  <h1 className="sporty-title glow-text-gold">🏟️ LIVE STADIUM DRAFT ENTRY</h1>
                  <p className="hero-subtitle">Enter your secure captain franchise ID and password to participate.</p>
                </div>

                <div className="auth-card glass-panel flex-column animate-pulse-glow" style={{ maxWidth: '440px', margin: '0 auto', padding: '30px', borderRadius: '20px' }}>
                  <div className="flex-between border-bottom pb-8 width-full">
                    <h3 className="sporty-title text-gold" style={{ fontSize: '1.2rem' }}>⚡ CAPTAIN SIGN-IN</h3>
                    <button className="btn-close" onClick={() => setActivePortal('landing')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>✕ Cancel</button>
                  </div>

                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    loginAsTeam(teamIdInput.trim(), teamPasswordInput.trim()); 
                  }} className="auth-form flex-column gap-16 margin-t-20 width-full">
                    <div className="form-group text-left">
                      <label className="text-xs">Team Login ID</label>
                      <input
                        type="text"
                        className="input-premium text-center"
                        placeholder="T-XXXX"
                        value={teamIdInput}
                        onChange={(e) => setTeamIdInput(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group text-left">
                      <label className="text-xs">Access Password</label>
                      <input
                        type="password"
                        className="input-premium text-center"
                        placeholder="******"
                        value={teamPasswordInput}
                        onChange={(e) => setTeamPasswordInput(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-premium btn-gold" style={{ padding: '12px' }}>
                      Sign In to Bidding Deck 🔨
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW 4: PLAYER DRAFT PORTAL (REGISTRATION / STATUS) ── */}
        {activePortal === 'player_register' && (
          <div className="glass-panel player-panel animate-pulse-gold animate-fade-in">
            {!playerForm.isSubmitted ? (
              <>
                <div className="player-hero">
                  <h2 className="sporty-title glow-text-gold">REGISTER FOR THE DRAFT</h2>
                  <p>Submit your stats, select an avatar, and join the player pool for the {db.tournament?.name || "league"}.</p>
                </div>

                <form onSubmit={handlePlayerSubmit} className="player-form flex-column gap-20">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="input-premium"
                      placeholder="Enter your name"
                      value={playerForm.name}
                      onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Choose Avatar Style</label>
                    <div className="form-row-grid gap-12">
                      {PRESET_AVATARS.map(av => (
                        <div
                          key={av.id}
                          className={`avatar-preset-card flex-center flex-column glass-panel ${playerForm.avatarPreset === av.id ? 'active' : ''}`}
                          onClick={() => setPlayerForm({ ...playerForm, avatarPreset: av.id, avatarUrl: '' })}
                        >
                          <div className="preset-svg-wrapper" dangerouslySetInnerHTML={{ __html: av.svg }} />
                          <span className="text-xxs text-secondary truncate">{av.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="custom-avatar-upload margin-t-12">
                      <label className="text-xs text-secondary">Or Enter Custom Image URL</label>
                      <input
                        type="url"
                        className="input-premium input-sm"
                        placeholder="https://example.com/avatar.jpg"
                        value={playerForm.avatarUrl}
                        onChange={e => setPlayerForm({ ...playerForm, avatarUrl: e.target.value, avatarPreset: '' })}
                      />
                    </div>
                  </div>

                  <div className="form-row-grid">
                    <div className="form-group">
                      <label>Primary Role</label>
                      <select
                        className="input-premium"
                        value={playerForm.role}
                        onChange={e => setPlayerForm({ ...playerForm, role: e.target.value })}
                      >
                        <option value="Batsman">Batsman</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-Rounder">All-Rounder</option>
                        <option value="Wicket-Keeper">Wicket-Keeper</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Batting Style</label>
                      <select
                        className="input-premium"
                        value={playerForm.battingStyle}
                        onChange={e => setPlayerForm({ ...playerForm, battingStyle: e.target.value })}
                      >
                        <option value="Right Hand">Right Hand Batsman</option>
                        <option value="Left Hand">Left Hand Batsman</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Bowling Style</label>
                      <select
                        className="input-premium"
                        value={playerForm.bowlingStyle}
                        onChange={e => setPlayerForm({ ...playerForm, bowlingStyle: e.target.value })}
                      >
                        <option value="None">None</option>
                        <option value="Medium Pace">Medium Pace Bowler</option>
                        <option value="Fast">Fast Bowler</option>
                        <option value="Off Spin">Off Spin Spinner</option>
                        <option value="Leg Spin">Leg Spin Spinner</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-premium btn-gold btn-large">
                    Submit Roster Profile 🏏
                  </button>
                </form>
              </>
            ) : (
              (() => {
                const player = db.players.find(p => p.id === registeredPlayerId);

                if (!registeredPlayerId || !player) {
                  return (
                    <div className="text-center flex-center flex-column gap-16 padding-30 animate-pulse-gold">
                      <div className="cricket-ball-icon" style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>🏏</div>
                      <h3 className="sporty-title">Connecting to Server...</h3>
                      <p className="text-secondary text-sm">Transmitting profile details securely to the live drafting database.</p>
                    </div>
                  );
                }

                let statusHeading = "Awaiting Auctioneer Review";
                let statusDesc = "Your profile is registered! The auctioneer is currently setting your starting Base Price and approving you for the bidding pool.";
                let glowClass = "animate-pulse-gold";

                if (player.status === 'approved') {
                  statusHeading = "Approved & Draft Ready!";
                  statusDesc = `Excellent! Your starting Base Price is configured at ${formatCurrency(player.basePrice)}. When the auctioneer calls your name, bidding will launch!`;
                  glowClass = "animate-pulse-glow";
                } else if (player.status === 'active') {
                  statusHeading = "UNDER THE HAMMER (LIVE) 🔨";
                  statusDesc = `You are currently live on the center stage under the bidding block! Active highest bid is ${formatCurrency(db.auctionState.currentBid)}. Watch tabs live!`;
                  glowClass = "animate-pulse-red";
                } else if (player.status === 'sold') {
                  const winningTeam = db.teams.find(t => t.id === player.soldToTeamId);
                  statusHeading = "CONGRATULATIONS - SOLD! 🎉";
                  statusDesc = `Huge congratulations! You were sold to the ${winningTeam?.name || "Premium Squad"} for a sum of ${formatCurrency(player.soldPrice)}!`;
                  glowClass = "animate-pulse-glow";
                } else if (player.status === 'unsold') {
                  statusHeading = "UNSOLD (DRAFT ENDED) ❌";
                  statusDesc = "No bids were successfully made before the countdown clock reached zero. You have been placed in the unsold backup pool.";
                  glowClass = "";
                }

                return (
                  <div className="player-status-dashboard flex-center flex-column gap-20">
                    <div className="setup-hero">
                      <h2 className="sporty-title glow-text-gold">Live Player Dashboard</h2>
                      <p>Real-time drafting updates sync automatically across all active stadium channels.</p>
                    </div>

                    <div className={`player-showcase-large glass-panel ${glowClass} flex-center flex-column relative-pos`}>
                      {player.status === 'sold' && <div className="sold-stamp">SOLD</div>}
                      {player.status === 'unsold' && <div className="stamp-unsold-overlay">UNSOLD</div>}
                      <div className="showcase-avatar-large">
                        {renderAvatarSVG(player.avatarPreset, player.avatarUrl)}
                      </div>
                      <h3 className="sporty-title text-xl font-bold">{player.name}</h3>
                      <span className={`badge-role badge-${player.role.toLowerCase().replace('-', '')}`}>
                        {player.role}
                      </span>

                      <div className="player-stats-matrix glass-panel width-full flex-center flex-wrap gap-16">
                        <div className="stat-box">
                          <span className="label text-muted">Batting</span>
                          <span className="val font-bold">{player.battingStyle}</span>
                        </div>
                        <div className="stat-box border-left">
                          <span className="label text-muted">Bowling</span>
                          <span className="val font-bold">{player.bowlingStyle}</span>
                        </div>
                      </div>

                      {player.basePrice > 0 && (
                        <div className="price-tag-large glass-panel flex-center gap-12 width-full">
                          <div>
                            <span className="label block text-muted">BASE PRICE</span>
                            <span className="val text-green font-bold">{formatCurrency(player.basePrice)}</span>
                          </div>
                          {player.status === 'sold' && (
                            <div className="border-left padding-l-12">
                              <span className="label block text-muted">SOLD PRICE</span>
                              <span className="val text-gold font-bold">{formatCurrency(player.soldPrice)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="status-indicator-box glass-panel padding-16 width-full">
                      <h4 className="sporty-title flex-center gap-8 text-sm">
                        <span className="live-dot"></span> STATUS: {statusHeading}
                      </h4>
                      <p className="text-secondary text-sm text-center margin-t-4">{statusDesc}</p>
                    </div>

                    <button
                      className="btn-premium btn-secondary"
                      onClick={() => setPlayerForm(prev => ({ ...prev, isSubmitted: false }))}
                    >
                      Register a New Player Profile
                    </button>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* ── VIEW 5: SQUADS & PLAYING 11 SHOWCASE ── */}
        {activePortal === 'squad_showcase' && (
          <div className="landing-page animate-fade-in flex-column gap-20" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {!db.setupComplete ? (
              <div className="pending-state-card glass-panel">
                <div className="icon">🏆</div>
                <h3 className="sporty-title glow-text-gold">No Configured Squads</h3>
                <p>
                  The tournament configuration is currently pending setup. Franchise squads and Playing XI field structures will display here in real-time once active.
                </p>
                <button className="btn-premium btn-secondary btn-sm" onClick={() => setActivePortal('landing')}>
                  Return to Home
                </button>
              </div>
            ) : (
              <>
                <div className="landing-hero" style={{ paddingBottom: '10px' }}>
                  <h1 className="sporty-title glow-text-gold">🏆 FRANCHISE SQUADS & PLAYING XI</h1>
                  <p className="hero-subtitle">Select any team below to visualize their live purchased squad and active playing XI layout.</p>
                </div>

                {/* MVP Banner — shown when all auction-eligible players have been processed */}
                {(() => {
                  const soldPlayers = db.players.filter(p => p.status === 'sold');
                  const pendingPlayers = db.players.filter(p => p.status === 'approved' || p.status === 'active');
                  const auctionDone = soldPlayers.length > 0 && pendingPlayers.length === 0;
                  if (!auctionDone) return null;
                  const mvp = soldPlayers.reduce((best, p) => (!best || p.soldPrice > best.soldPrice) ? p : best, null);
                  const mvpTeam = mvp ? db.teams.find(t => t.id === mvp.soldToTeamId) : null;
                  return <MVPShowcase mvpPlayer={mvp} mvpTeam={mvpTeam} renderAvatarSVG={renderAvatarSVG} formatCurrency={formatCurrency} />;
                })()}
                
                <RosterShowcasePitch
                  db={db}
                  authState={authState}
                  selectedTeamId={selectedShowcaseTeamId}
                  setSelectedTeamId={setSelectedShowcaseTeamId}
                  togglePlaying11={togglePlaying11}
                  renderAvatarSVG={renderAvatarSVG}
                  formatCurrency={formatCurrency}
                />
              </>
            )}
          </div>
        )}

      </main>

      {/* Global Reset footer warning */}
      <div className="landing-footer-note text-muted italic margin-t-30" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem' }}>
          Want to start a different tournament?{' '}
          <span className="text-gold font-bold pointer" style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--red-accent, #ff4d4d)' }} onClick={() => {
            if (window.confirm("Are you sure you want to reset the database and create a brand-new auction tournament? This will erase all current squads, players, and credentials.")) {
              resetDatabase();
              setActivePortal('landing');
            }
          }}>
            Click here to reset & create a new auction 🏆
          </span>
        </span>
      </div>
    </div>
  );
}

export default App;
