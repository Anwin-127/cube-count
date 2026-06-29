import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RoomService } from '../online/RoomService';

export function OnlineMenuScreen({ initialJoinCode }: { initialJoinCode?: string }) {
  const goToHome = useGameStore((s) => s.goToHome);
  const goToWaitingRoom = useGameStore((s) => s.goToWaitingRoom);
  const setOnlineIdentity = useGameStore((s) => s.setOnlineIdentity);
  const setActiveRoom = useGameStore((s) => s.setActiveRoom);
  const playerUid = useGameStore((s) => s.playerUid);

  const [displayName, setDisplayName] = useState('');
  const [step, setStep] = useState<'menu' | 'name-create' | 'join' | 'name-join'>(initialJoinCode ? 'name-join' : 'menu');
  const [joinCode, setJoinCode] = useState(initialJoinCode || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setError(null);
    if (!playerUid) {
      setError('Not authenticated with online services.');
      return;
    }
    setOnlineIdentity(playerUid, displayName.trim());
    setIsLoading(true);
    try {
      const result = await RoomService.createRoom(playerUid, displayName.trim());
      if (result) {
        setActiveRoom(result.roomId, result.roomCode, playerUid);
        goToWaitingRoom();
      } else {
        setError('Failed to create room.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setError(null);
    if (!playerUid) {
      setError('Not authenticated with online services.');
      return;
    }
    setOnlineIdentity(playerUid, displayName.trim());
    await executeJoinRoom(joinCode);
  };

  const executeJoinRoom = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!playerUid) throw new Error('Not authenticated');
      const result = await RoomService.joinRoom(code.toUpperCase().trim(), playerUid, displayName.trim());
      if (result) {
        setActiveRoom(result.roomId, code.toUpperCase().trim(), result.hostUid, playerUid);
        goToWaitingRoom();
      }
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Failed to join room';
      if (msg.includes('Room not found')) msg = 'Room not found. It may have expired or closed.';
      setError(msg);
      // Let them retry join
      if (!initialJoinCode) setStep('join'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }
    setError(null);
    setStep('name-join');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-tight">Online VS</h1>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {step === 'menu' && (
          <div className="flex flex-col gap-4">
            <button onClick={() => setStep('name-create')} disabled={isLoading} className="geo-button w-full">
              CREATE ROOM
            </button>
            <button onClick={() => setStep('join')} disabled={isLoading} className="geo-button-secondary w-full">
              JOIN ROOM
            </button>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="button" onClick={goToHome} className="geo-button-secondary w-full">
              BACK
            </button>
          </div>
        )}

        {step === 'name-create' && (
          <form onSubmit={handleCreateNameSubmit} className="flex flex-col gap-4">
            <div className="text-center mb-2">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Player 1</span>
            </div>
            <label className="text-sm font-medium text-gray-800 uppercase tracking-widest text-center">
              Enter your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-center text-2xl py-3 border-b-2 border-gray-300 focus:border-primary outline-none uppercase font-mono"
              placeholder="PLAYER 1"
              maxLength={12}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={isLoading} className="geo-button w-full mt-4">
              {isLoading ? 'CREATING...' : 'CREATE ROOM'}
            </button>
            <button type="button" onClick={() => { setStep('menu'); setError(null); }} className="geo-button-secondary w-full">
              BACK
            </button>
          </form>
        )}

        {step === 'join' && (
          <form onSubmit={handleJoinCodeSubmit} className="flex flex-col gap-4">
             <label className="text-sm font-medium text-gray-500 uppercase tracking-widest text-center">
              Enter Room Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="text-center text-3xl py-3 border-b-2 border-gray-300 focus:border-primary outline-none uppercase font-mono tracking-widest"
              placeholder="XXXXXX"
              maxLength={6}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="geo-button w-full mt-4">
              CONTINUE
            </button>
            <button type="button" onClick={() => { setStep('menu'); setError(null); }} className="geo-button-secondary w-full">
              BACK
            </button>
          </form>
        )}

        {step === 'name-join' && (
          <form onSubmit={handleJoinNameSubmit} className="flex flex-col gap-4">
            <div className="text-center mb-2">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Player 2</span>
            </div>
            <label className="text-sm font-medium text-gray-800 uppercase tracking-widest text-center">
              Enter your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-center text-2xl py-3 border-b-2 border-gray-300 focus:border-primary outline-none uppercase font-mono"
              placeholder="PLAYER 2"
              maxLength={12}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={isLoading} className="geo-button w-full mt-4">
              {isLoading ? 'JOINING...' : 'JOIN ROOM'}
            </button>
            <button type="button" onClick={() => { 
                if (initialJoinCode) goToHome();
                else { setStep('join'); setError(null); }
              }} className="geo-button-secondary w-full">
              BACK
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
