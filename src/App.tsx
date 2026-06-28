import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { GamePhase } from './models/GamePhase';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { useGameLoop } from './hooks/useGameLoop';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { RoundResultsScreen } from './screens/RoundResultsScreen';
import { FinalResultsScreen } from './screens/FinalResultsScreen';

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
  const [devRoute, setDevRoute] = useState(window.location.hash);

  // Listen for hash changes (could be used for future routing)
  useEffect(() => {
    const handleHashChange = () => setDevRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderScreen = () => {
    switch (phase) {
      case GamePhase.HOME:
        return <HomeScreen />;

      case GamePhase.SETTINGS:
        return <SettingsScreen />;

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
