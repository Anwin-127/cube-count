import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { GamePhase } from './models/GamePhase';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { useGameLoop } from './hooks/useGameLoop';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { RoundResultsScreen } from './screens/RoundResultsScreen';
import { FinalResultsScreen } from './screens/FinalResultsScreen';
import { OnlineMenuScreen } from './screens/OnlineMenuScreen';
import { WaitingRoomScreen } from './screens/WaitingRoomScreen';
import { SynchronizingScreen } from './screens/SynchronizingScreen';
import { AuthService } from './online/AuthService';
import { OnlineGameplayService } from './online/OnlineGameplayService';
import { TimeService } from './online/TimeService';

/**
 * Root application component.
 *
 * Renders the appropriate screen based on the current game phase.
 * This is the single point where the FSM state maps to UI screens.
 *
 * The keyboard input hook and game loop hook are mounted here
 * so they remain active across all screens.
 *
 * Dev-only routes (e.g., #playground) bypass the FSM entirely
 * and are checked before the phase-based rendering.
 */
function App() {
  useKeyboardInput();
  useGameLoop();

  const phase = useGameStore((s) => s.phase);
  const [inviteCode, setInviteCode] = useState<string | undefined>();

  // Check for invite link on load
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/play/')) {
      const code = path.split('/play/')[1]?.toUpperCase();
      if (code && code.length === 6) {
        setTimeout(() => setInviteCode(code), 0);
        // Clean up URL without reloading
        window.history.replaceState({}, '', '/');
        // Force phase transition if not already handled
        useGameStore.getState().goToOnlineMenu();
      }
    }
  }, []);

  // Initialize Firebase anonymous auth and TimeService
  useEffect(() => {
    TimeService.init();
    AuthService.signIn().then((user) => {
      if (user) {
        useGameStore.getState().setOnlineIdentity(user.uid, ''); // Name is set later
      }
    });
  }, []);

  const activeRoomId = useGameStore((s) => s.activeRoomId);
  useEffect(() => {
    if (activeRoomId) {
      return OnlineGameplayService.listenToMatchState(activeRoomId);
    }
  }, [activeRoomId]);

  const renderScreen = () => {
    switch (phase) {
      case GamePhase.HOME:
        return <HomeScreen />;

      case GamePhase.SETTINGS:
        return <SettingsScreen />;

      case GamePhase.ONLINE_MENU:
        return <OnlineMenuScreen initialJoinCode={inviteCode} />;

      case GamePhase.WAITING_ROOM:
        return <WaitingRoomScreen />;

      case GamePhase.ONLINE_SYNCHRONIZING:
        return <SynchronizingScreen />;

      case GamePhase.ONLINE_COUNTDOWN:
      case GamePhase.GENERATING_PUZZLE:
      case GamePhase.DISPLAYING_PUZZLE:
      case GamePhase.ANSWER_PHASE:
      case GamePhase.VALIDATING:
        return <GameplayScreen />;

      case GamePhase.ROUND_RESULTS:
        return <RoundResultsScreen />;

      case GamePhase.FINAL_RESULTS:
        return <FinalResultsScreen />;

      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary font-sans antialiased">
      {renderScreen()}
    </div>
  );
}

export default App;
