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

function App() {
  const {
    db,
    connected,
    bidError,
    authError,
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
    togglePlaying11
  } = useAuctionState();

  // URL View selector (for bypassable registration flow)
  const [isPlayerRegisterMode, setIsPlayerRegisterMode] = useState(false);

  // Portal and Flow States
  const [activePortal, setActivePortal] = useState('landing'); // 'landing' | 'auctioneer_login' | 'live_auction_gate'
  const [isRegisteringAuctioneer, setIsRegisteringAuctioneer] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    auctioneerName: '',
    auctioneerId: '',
    auctioneerPassword: ''
  });
  const [liveAuctionRole, setLiveAuctionRole] = useState(null); // 'auctioneer' | 'captain' | null
  const [showPortalDropdown, setShowPortalDropdown] = useState(false);

  // Authentication UI Input States
  const [authTab, setAuthTab] = useState('auctioneer'); // 'auctioneer' | 'team'
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

  // Auctioneer Dashboard Tab Selection ('live' | 'management')
  const [auctioneerTab, setAuctioneerTab] = useState('live');

  // Selected showcase team for squads & playing XI view
  const [selectedShowcaseTeamId, setSelectedShowcaseTeamId] = useState(null);

  // Captain Dashboard Tab Selection ('bidding' | 'pitch')
  const [captainTab, setCaptainTab] = useState('bidding');

  // Real-time clipboard feedback
  const [copyFeedback, setCopyFeedback] = useState('');

  // Handle URL query parameters for player registration link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'player-register') {
      setIsPlayerRegisterMode(true);
    }
  }, []);

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

  // Render player registration bypass panel (does not require login)
  if (isPlayerRegisterMode) {
    return (
      <div className="app-container">
        <header className="glass-panel main-header flex-between">
          <div className="header-brand">
            <div className="cricket-ball-icon">🏏</div>
            <div>
              <h1 className="sporty-title glow-text-gold">STADIUM AUCTION</h1>
              <p className="subtitle">{db.tournament?.name || "Player Registration Portal"}</p>
            </div>
          </div>
          <div className="header-controls flex-center">
            <button className="btn-premium btn-secondary btn-sm" onClick={() => setIsPlayerRegisterMode(false)}>
              Back to Portal
            </button>
          </div>
        </header>

        <main className="glass-panel player-panel animate-pulse-gold">
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
                statusDesc = `Huge congratulations! You were sold to the ${winningTeam?.name || "Premium Squad"} for a jaw-dropping sum of ${formatCurrency(player.soldPrice)}!`;
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
        </main>
      </div>
    );
  }

  // Render Portal Setup (if tournament setup is incomplete)
  if (!db.setupComplete) {
    return (
      <div className="app-container">
        <header className="glass-panel main-header flex-between">
          <div className="header-brand">
            <div className="cricket-ball-icon">🏏</div>
            <div>
              <h1 className="sporty-title glow-text-gold">STADIUM AUCTION</h1>
              <p className="subtitle">Tournament Setup & Registration Portal</p>
            </div>
          </div>
        </header>

        <main className="registration-grid padding-20">
          {/* Left Column: Config & Admin Account */}
          <div className="flex-column gap-20">
            <div className="form-section-card">
              <h2 className="sporty-title glow-text-gold" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>
                🏆 TOURNAMENT VARIABLES
              </h2>
              <div className="setup-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="text-xs">Tournament Name</label>
                  <input
                    type="text"
                    className="input-premium"
                    value={setupForm.tournamentName}
                    onChange={e => setSetupForm({ ...setupForm, tournamentName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="text-xs">Auctioneer Name</label>
                  <input
                    type="text"
                    className="input-premium"
                    value={setupForm.auctioneerName}
                    onChange={e => setSetupForm({ ...setupForm, auctioneerName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="text-xs">Category (Gender)</label>
                  <select
                    className="input-premium"
                    value={setupForm.gender}
                    onChange={e => setSetupForm({ ...setupForm, gender: e.target.value })}
                  >
                    <option value="Men">Men's Tournament</option>
                    <option value="Women">Women's Tournament</option>
                    <option value="Mixed">Mixed League</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="text-xs">Starting Budget (₹)</label>
                  <input
                    type="number"
                    className="input-premium"
                    value={setupForm.startingBudget}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setSetupForm({ ...setupForm, startingBudget: val });
                      // Update budget for already generated teams
                      setSetupTeams(setupTeams.map(t => ({ ...t, budget: val })));
                    }}
                    min="1000000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="text-xs">Min Bid Increment (₹)</label>
                  <input
                    type="number"
                    className="input-premium"
                    value={setupForm.minBidIncrement}
                    onChange={e => setSetupForm({ ...setupForm, minBidIncrement: Number(e.target.value) })}
                    min="10000"
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="text-xs">Bidding Countdown (seconds)</label>
                  <input
                    type="number"
                    className="input-premium"
                    value={setupForm.timerSeconds}
                    onChange={e => setSetupForm({ ...setupForm, timerSeconds: Number(e.target.value) })}
                    min="10"
                    max="120"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Auctioneer Login Settings */}
            <div className="form-section-card" style={{ borderLeft: '3px solid var(--gold-accent)' }}>
              <h2 className="sporty-title text-gold" style={{ fontSize: '1.2rem', marginBottom: '6px' }}>
                🔑 AUCTIONEER LOGIN CREDENTIALS
              </h2>
              <p className="text-muted text-xs" style={{ marginBottom: '16px' }}>
                Set custom credentials to securely log back into your auction control panel at any time.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="text-xs">Auctioneer ID</label>
                  <input
                    type="text"
                    className="input-premium font-bold text-gold"
                    value={setupForm.auctioneerId}
                    onChange={e => setSetupForm({ ...setupForm, auctioneerId: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="text-xs">Access Password</label>
                  <input
                    type="text"
                    className="input-premium font-bold text-gold"
                    value={setupForm.auctioneerPassword}
                    onChange={e => setSetupForm({ ...setupForm, auctioneerPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pre-register Teams & Generated Credentials */}
          <div className="flex-column gap-20">
            <div className="form-section-card">
              <h2 className="sporty-title glow-text-gold" style={{ fontSize: '1.3rem', marginBottom: '12px' }}>
                🏏 BID SQUADS PRE-REGISTRATION
              </h2>
              <p className="text-muted text-xs" style={{ marginBottom: '16px' }}>
                Register team details below. The terminal will dynamically generate distinct, secure **Login IDs** and **Passwords** for each captain in real-time.
              </p>

              {/* Form to add a team */}
              <form onSubmit={addTeamToSetup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="text-xs">Team / Franchise Name</label>
                  <input
                    type="text"
                    className="input-premium input-sm"
                    placeholder="e.g. Kolkata Knight Riders"
                    value={tempTeam.name}
                    onChange={e => setTempTeam({ ...tempTeam, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="text-xs">Captain Name</label>
                  <input
                    type="text"
                    className="input-premium input-sm"
                    placeholder="e.g. Shreyas Iyer"
                    value={tempTeam.captain}
                    onChange={e => setTempTeam({ ...tempTeam, captain: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn-premium btn-secondary width-full btn-sm" style={{ padding: '10px' }}>
                    + Generate Credentials
                  </button>
                </div>
              </form>

              {/* List of generated teams */}
              <h3 className="sporty-title text-sm" style={{ marginBottom: '10px' }}>
                👥 CONFIGURED SQUADS ({setupTeams.length})
              </h3>

              {setupTeams.length === 0 ? (
                <div className="text-center text-muted padding-30 text-sm" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                  No squads registered yet. Add team parameters to generate secure credentials.
                </div>
              ) : (
                <div className="squads-setup-list">
                  {setupTeams.map((team, idx) => (
                    <div key={idx} className="setup-team-row">
                      <div className="setup-team-info">
                        <h4>{team.name}</h4>
                        <p>Captain: <strong>{team.captain}</strong> | Budget: {formatCurrency(setupForm.startingBudget)}</p>
                        <div className="setup-cred-badge-inline">
                          <div className="setup-cred-badge">
                            <span>ID:</span>{team.loginId}
                          </div>
                          <div className="setup-cred-badge">
                            <span>PASS:</span>{team.loginPassword}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-setup-team text-red"
                        onClick={() => removeTeamFromSetup(idx)}
                        title="Remove Team"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Launch Action */}
            <div className="flex-column gap-12" style={{ marginTop: 'auto' }}>
              <button
                onClick={handleSetupSubmit}
                className="btn-premium btn-gold btn-large font-bold"
                style={{ fontSize: '1.15rem', padding: '18px 24px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 0 30px var(--gold-glow)' }}
              >
                Launch Premium Auction Stadium 🚀
              </button>
              <p className="text-center text-muted text-xxs">
                Ensure all squads and credentials are saved/copied. Cap logins will sync automatically.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Secure Portal Landing Page: When authenticated is false
  if (!authState.authenticated) {
    return (
      <div className="app-container">
        {/* Top Header with Portal Navigation Switcher */}
        <header className="glass-panel main-header flex-between">
          <div className="header-brand flex-center gap-12">
            <div className="cricket-ball-icon">🏏</div>
            <div className="portal-dropdown-wrapper" style={{ position: 'relative' }}>
              <button 
                className="btn-premium btn-portal-select flex-center gap-8"
                onClick={() => setShowPortalDropdown(!showPortalDropdown)}
                style={{ fontSize: '0.9rem', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}
              >
                🌐 {activePortal === 'landing' ? 'HOME LANDING' : activePortal === 'auctioneer_login' ? 'AUCTIONEER PORTAL' : activePortal === 'live_auction_gate' ? 'LIVE AUCTION GATE' : 'SQUADS & PLAYING 11'} <span className="arrow-down">▾</span>
              </button>
              {showPortalDropdown && (
                <div className="portal-dropdown-menu glass-panel animate-fade-in" style={{ position: 'absolute', top: '55px', left: '0', zIndex: '999', display: 'flex', flexDirection: 'column', gap: '4px', width: '220px', padding: '8px', borderRadius: '12px' }}>
                  <button 
                    className={`portal-dropdown-item ${activePortal === 'landing' ? 'active' : ''}`}
                    onClick={() => { setActivePortal('landing'); setShowPortalDropdown(false); }}
                  >
                    🏠 Home Landing
                  </button>
                  <button 
                    className={`portal-dropdown-item ${activePortal === 'auctioneer_login' ? 'active' : ''}`}
                    onClick={() => { setActivePortal('auctioneer_login'); setShowPortalDropdown(false); }}
                  >
                    🎙️ Auctioneer Portal
                  </button>
                  <button 
                    className={`portal-dropdown-item ${activePortal === 'live_auction_gate' ? 'active' : ''}`}
                    onClick={() => { setActivePortal('live_auction_gate'); setShowPortalDropdown(false); }}
                  >
                    🏟️ Start Live Auction
                  </button>
                  <button 
                    className={`portal-dropdown-item ${activePortal === 'squad_showcase' ? 'active' : ''}`}
                    onClick={() => { setActivePortal('squad_showcase'); setShowPortalDropdown(false); }}
                  >
                    📋 Squads & Playing 11
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="header-controls flex-center gap-12">
            <button className="btn-premium btn-secondary btn-sm" onClick={() => setIsPlayerRegisterMode(true)}>
              Player Join Portal
            </button>
            <div className="connection-badge connected">● SERVER ONLINE</div>
          </div>
        </header>

        {authError && (
          <div className="toast-error-banner animate-pulse-red" style={{ top: '80px', zIndex: '1000' }}>
            ⚠️ {authError}
          </div>
        )}

        {/* ── VIEW 1: HOME LANDING PAGE ── */}
        {activePortal === 'landing' && (
          <div className="landing-page animate-fade-in">
            <div className="landing-hero">
              <h1 className="sporty-title glow-text-gold">STADIUM CRICKET AUCTION</h1>
              <p className="hero-subtitle">
                The ultimate premium live bidding and drafting arena. Orchestrate your team selections with state-of-the-art administrative consoles and real-time captain bidding wars.
              </p>

              {/* Mid-section Option: Create New Tournament */}
              <div className="cta-showcase glass-panel margin-y-30 text-center flex-center flex-column gap-16" style={{ padding: '30px', maxWidth: '600px', margin: '30px auto', borderRadius: '20px', border: '1px solid rgba(255, 215, 0, 0.15)' }}>
                <h3 className="sporty-title text-gold" style={{ fontSize: '1.25rem' }}>🏆 START A PREMIER LEAGUE</h3>
                <p className="text-secondary text-sm">
                  Register as the Auction Administrator (Auctioneer) to configure teams, set up bidding boundaries, and coordinate the draft live.
                </p>
                {db.auctioneerRegistered ? (
                  <div className="flex-column gap-8">
                    <span className="badge-role badge-batsman">✓ AUCTIONEER PROFILE IS REGISTERED</span>
                    <button 
                      className="btn-premium btn-gold btn-large" 
                      onClick={() => setActivePortal('auctioneer_login')}
                      style={{ padding: '14px 28px' }}
                    >
                      Login to Setup / Dashboard 🎙️
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn-premium btn-gold btn-large animate-pulse-glow" 
                    onClick={() => setIsRegisteringAuctioneer(true)}
                    style={{ padding: '14px 28px', fontSize: '1rem', letterSpacing: '1px' }}
                  >
                    Create New Tournament 🏆
                  </button>
                )}
              </div>
            </div>

            {/* About Section */}
            <div className="about-section glass-panel margin-t-40" style={{ padding: '40px', borderRadius: '20px' }}>
              <h2 className="sporty-title text-gold text-center margin-b-30" style={{ fontSize: '1.6rem' }}>🏟️ SYSTEM FEATURES</h2>
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
                    Roster balances updates instantly with transaction fees deducted from individual starting budgets after winning players.
                  </p>
                </div>
              </div>
            </div>

            {/* Auctioneer Registration Overlay Modal */}
            {isRegisteringAuctioneer && (
              <div className="modal-backdrop flex-center" style={{ position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: '1001' }}>
                <div className="glass-panel modal-card animate-pulse-gold flex-column gap-20" style={{ padding: '30px', width: '90%', maxWidth: '480px', borderRadius: '20px', border: '1px solid var(--gold-accent)' }}>
                  <div className="flex-between border-bottom pb-8">
                    <h3 className="sporty-title text-gold" style={{ fontSize: '1.3rem' }}>🎙️ REGISTER AUCTIONEER</h3>
                    <button className="btn-close" onClick={() => setIsRegisteringAuctioneer(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!registerForm.auctioneerName.trim() || !registerForm.auctioneerId.trim() || !registerForm.auctioneerPassword.trim()) {
                      alert("Please fill in all details.");
                      return;
                    }
                    registerAuctioneer(registerForm);
                    setIsRegisteringAuctioneer(false);
                    alert("Auctioneer Profile successfully registered! Navigate to the 'Auctioneer Portal' using the top-left dropdown to sign in.");
                    setActivePortal('auctioneer_login');
                  }} className="auth-form flex-column gap-16">
                    <div className="form-group text-left">
                      <label className="text-xs">Full Name</label>
                      <input 
                        type="text" 
                        className="input-premium" 
                        placeholder="e.g. Master Auctioneer"
                        value={registerForm.auctioneerName}
                        onChange={e => setRegisterForm({ ...registerForm, auctioneerName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group text-left">
                      <label className="text-xs">Auctioneer Username / User ID</label>
                      <input 
                        type="text" 
                        className="input-premium" 
                        placeholder="e.g. admin"
                        value={registerForm.auctioneerId}
                        onChange={e => setRegisterForm({ ...registerForm, auctioneerId: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group text-left">
                      <label className="text-xs">Access Password</label>
                      <input 
                        type="password" 
                        className="input-premium" 
                        placeholder="Set password"
                        value={registerForm.auctioneerPassword}
                        onChange={e => setRegisterForm({ ...registerForm, auctioneerPassword: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-premium btn-gold margin-t-12" style={{ padding: '12px' }}>
                      Register & Set Admin Profile 🏆
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW 2: AUCTIONEER SETUP & LOGIN PORTAL ── */}
        {activePortal === 'auctioneer_login' && (
          <div className="landing-page animate-fade-in text-center">
            <div className="landing-hero" style={{ paddingBottom: '20px' }}>
              <h1 className="sporty-title glow-text-gold">🎙️ AUCTIONEER PORTAL</h1>
              <p className="hero-subtitle">Log in using your registered admin credentials to configure and manage your tournament.</p>
            </div>

            <div className="auth-card glass-panel flex-column animate-pulse-gold" style={{ maxWidth: '440px', margin: '0 auto', padding: '30px', borderRadius: '20px' }}>
              <span className="auth-icon" style={{ fontSize: '3rem' }}>🎙️</span>
              <h2 className="sporty-title text-gold" style={{ fontSize: '1.4rem', margin: '12px 0' }}>AUCTIONEER CONSOLE</h2>
              
              {!db.auctioneerRegistered ? (
                <div className="flex-column gap-16 padding-20">
                  <p className="text-muted text-sm">No Auctioneer has been registered on the landing page yet.</p>
                  <button className="btn-premium btn-gold btn-sm" onClick={() => setActivePortal('landing')}>
                    Go Register Now 🏆
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  loginAsAuctioneer({ loginId: aucIdInput, loginPassword: aucPasswordInput }); 
                }} className="auth-form flex-column gap-16">
                  <div className="form-group text-left">
                    <label className="text-xs">Auctioneer Login ID</label>
                    <input
                      type="text"
                      className="input-premium text-center"
                      placeholder="e.g. admin"
                      value={aucIdInput}
                      onChange={(e) => setAucIdInput(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group text-left">
                    <label className="text-xs">Access Password</label>
                    <input
                      type="password"
                      className="input-premium text-center"
                      placeholder="••••••"
                      value={aucPasswordInput}
                      onChange={(e) => setAucPasswordInput(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-premium btn-gold" style={{ marginTop: '8px', padding: '12px' }}>
                    Authorize & Control Roster ⚡
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── VIEW 3: START LIVE AUCTION GATE ── */}
        {activePortal === 'live_auction_gate' && (
          <div className="landing-page animate-fade-in text-center">
            <div className="landing-hero" style={{ paddingBottom: '20px' }}>
              <h1 className="sporty-title glow-text-gold">🏟️ LIVE STADIUM DRAFT ENTRY</h1>
              <p className="hero-subtitle">Select your credential role to access the center bidding terminals.</p>
            </div>

            {liveAuctionRole === null ? (
              <div className="auth-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>
                <div 
                  className="auth-card glass-panel flex-column pointer hover-glow-gold"
                  onClick={() => setLiveAuctionRole('auctioneer')}
                  style={{ padding: '30px', cursor: 'pointer', borderRadius: '16px' }}
                >
                  <span className="auth-icon" style={{ fontSize: '3rem' }}>🎙️</span>
                  <h3 className="sporty-title text-gold" style={{ margin: '16px 0 8px 0' }}>JOIN AS AUCTIONEER</h3>
                  <p className="text-secondary text-xs">Access admin tools to launch drafting clocks, configure pricing thresholds, and close player bidding rounds.</p>
                </div>

                <div 
                  className="auth-card glass-panel flex-column pointer hover-glow-green"
                  onClick={() => setLiveAuctionRole('captain')}
                  style={{ padding: '30px', cursor: 'pointer', borderRadius: '16px' }}
                >
                  <span className="auth-icon" style={{ fontSize: '3rem' }}>⚡</span>
                  <h3 className="sporty-title text-green" style={{ margin: '16px 0 8px 0' }}>JOIN AS CAPTAIN</h3>
                  <p className="text-secondary text-xs">Enter captain bidding screen to view the live pool, check squad balances, and compete for players.</p>
                </div>
              </div>
            ) : (
              <div className="auth-card glass-panel flex-column animate-pulse-glow" style={{ maxWidth: '440px', margin: '0 auto', padding: '30px', borderRadius: '20px' }}>
                <div className="flex-between border-bottom pb-8 width-full">
                  <h3 className="sporty-title text-gold" style={{ fontSize: '1.2rem' }}>
                    {liveAuctionRole === 'auctioneer' ? '🎙️ AUCTIONEER SIGN-IN' : '⚡ CAPTAIN SIGN-IN'}
                  </h3>
                  <button className="btn-close" onClick={() => setLiveAuctionRole(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>✕ Back</button>
                </div>

                {liveAuctionRole === 'auctioneer' ? (
                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    loginAsAuctioneer({ loginId: aucIdInput, loginPassword: aucPasswordInput }); 
                  }} className="auth-form flex-column gap-16 margin-t-20 width-full">
                    <div className="form-group text-left">
                      <label className="text-xs">Auctioneer Login ID</label>
                      <input
                        type="text"
                        className="input-premium text-center"
                        placeholder="e.g. admin"
                        value={aucIdInput}
                        onChange={(e) => setAucIdInput(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group text-left">
                      <label className="text-xs">Access Password</label>
                      <input
                        type="password"
                        className="input-premium text-center"
                        placeholder="••••••"
                        value={aucPasswordInput}
                        onChange={(e) => setAucPasswordInput(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-premium btn-gold" style={{ padding: '12px' }}>
                      Sign In & Direct Live 🔨
                    </button>
                  </form>
                ) : (
                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    loginAsTeam(teamIdInput, teamPasswordInput); 
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
                )}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW 4: SQUADS & PLAYING 11 SHOWCASE (VISITOR) ── */}
        {activePortal === 'squad_showcase' && (
          <div className="landing-page animate-fade-in flex-column gap-20" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div className="landing-hero" style={{ paddingBottom: '10px' }}>
              <h1 className="sporty-title glow-text-gold">🏆 FRANCHISE SQUADS & PLAYING XI</h1>
              <p className="hero-subtitle">Select any team below to visualize their live purchased squad and active playing XI layout.</p>
            </div>
            
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

        <div className="landing-footer-note text-muted italic margin-t-30" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem' }}>
            Want to start a different tournament? <span className="text-gold font-bold pointer" style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--red-accent, #ff4d4d)' }} onClick={() => {
              if (window.confirm("Are you sure you want to reset the database and create a brand-new auction tournament? This will erase all current squads, players, and credentials.")) {
                resetDatabase();
                setActivePortal('landing');
              }
            }}>Click here to reset & create a new auction 🏆</span>
          </span>
        </div>
      </div>
    );
  }

  // Authenticated State views (Auctioneer Dashboard vs Team Dashboard)
  return (
    <div className="app-container">
      {/* Top Header Banner */}
      <header className="glass-panel main-header flex-between">
        <div className="auth-header-left">
          <div className="cricket-ball-icon">🏏</div>
          <div>
            <h1 className="sporty-title glow-text-gold">{db.tournament?.name || "Cricket Bidding Center"}</h1>
            <div className="flex-center gap-8 margin-t-4">
              <span className="role-label-badge">
                {authState.role === 'auctioneer' ? '🎙️ AUCTIONEER ADMIN' : `⚡ CAPTAIN: ${authState.teamName}`}
              </span>
              <span className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
                {connected ? '● LIVE SYNCED' : '○ OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="header-controls flex-center gap-12">
          {authState.role === 'auctioneer' && (
            <button className="btn-premium btn-secondary reset-btn btn-sm" onClick={resetDatabase}>
              Reset Database
            </button>
          )}
          <button className="btn-premium btn-logout btn-sm" onClick={logout}>
            Log Out 🚪
          </button>
        </div>
      </header>

      {/* Real-time Bid Error Toast */}
      {bidError && (
        <div className="toast-error-banner animate-pulse-red">
          ⚠️ {bidError}
        </div>
      )}

      {/* Copy link feedback banner */}
      {copyFeedback && (
        <div className="copy-feedback-banner animate-pulse-glow">
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* ACTIVE DASHBOARD VIEWS */}
      <div className="main-content">
        {authState.role === 'auctioneer' ? (
          /* =========================================================================
             1. AUCTIONEER ADMIN DASHBOARD
             ========================================================================= */
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
                                  style={{ width: `${(db.auctionState.timeLeft / db.tournament.timerSeconds) * 100}%` }}
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
                
                {/* Left Column: Invite Link, Player Approvals, Add Squad */}
                <div className="left-column flex-column gap-20">
                  
                  {/* Invitation generation banner */}
                  <section className="glass-panel section-padding invite-banner flex-between">
                    <div>
                      <h3 className="sporty-title glow-text-gold">ADD PLAYERS INVITE LINK</h3>
                      <p className="text-secondary text-sm">Generate player invitation links. Shared players can instantly fill out their profiles.</p>
                    </div>
                    <button className="btn-premium btn-gold btn-sm" onClick={copyInviteLink}>
                      Copy Registration Link 🔗
                    </button>
                  </section>

                  {/* Player Approvals and Roster management */}
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

                            {/* Price allocation form */}
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

                  {/* Teams Column & Team Creation Panel */}
                  <section className="glass-panel section-padding">
                    <span className="section-subheader border-bottom">MANAGE SQUADS & CREDS</span>
                    
                    {/* Team addition form */}
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
                          placeholder={`Budget (Default: ${formatCurrency(db.tournament.startingBudget)})`}
                          value={teamForm.budget}
                          onChange={e => setTeamForm({ ...teamForm, budget: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="btn-premium btn-gold btn-sm">
                        Add Team to League 🚀
                      </button>
                    </form>

                    {/* Registered Teams listing with budget tracking */}
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

                            {/* DISPLAY SECURE TEAM LOGIN ID AND PASSWORD */}
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
                                  style={{ width: `${(team.budget / db.tournament.startingBudget) * 100}%` }}
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

                {/* Right Column: Approved Draft Roster backup pool */}
                <div className="right-column flex-column gap-20">
                  
                  {/* Roster Pool of Approved Draft players */}
                  <section className="glass-panel section-padding" style={{ height: '100%' }}>
                    <span className="section-subheader border-bottom">
                      DRAFT ROSTER POOL <span className="badge-count">{db.players.filter(p => p.status !== 'registered' && p.status !== 'pending').length}</span>
                    </span>

                    <div className="roster-pool-list flex-column gap-12 margin-t-16" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                      {db.players.filter(p => p.status !== 'registered' && p.status !== 'pending').length === 0 ? (
                        <p className="empty-info-msg">No players registered or approved yet.</p>
                      ) : (
                        db.players.filter(p => p.status !== 'registered' && p.status !== 'pending').map(player => (
                          <div key={player.id} className="player-grid-card glass-panel flex-column justify-between relative-pos" style={{ minHeight: 'auto', padding: '12px' }}>
                            
                            {/* Overlay Sold stamps for status indicator */}
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
                                          alert("Please enter a valid positive number for the base price.");
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
                                      if (window.confirm(`Are you sure you want to remove ${player.name} from the auction pool?`)) {
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
          /* =========================================================================
             2. TEAM CAPTAIN BIDDING TERMINAL
             ========================================================================= */
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

                {/* Bidding Terminal Content */}
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
                                  style={{ width: `${(db.auctionState.timeLeft / db.tournament.timerSeconds) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Bid Submit hammer CTA */}
                          <div className="flex-column gap-8">
                            <button 
                              className={`btn-premium btn-gold btn-large animate-pulse-gold ${!canBid ? 'disabled' : ''}`}
                              disabled={!canBid}
                              onClick={placeBid}
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
                          style={{ width: `${(representingTeam.budget / db.tournament.startingBudget) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xxs text-secondary">Initial: {formatCurrency(db.tournament.startingBudget)}</span>
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
      )}
      </div>
    </div>
  );
}

export default App;
