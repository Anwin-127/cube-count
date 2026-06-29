import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameMode } from '../models/GameMode';
import { Difficulty } from '../models/Difficulty';
import type { PlayerRoundResult, RoundResult } from '../models/RoundResult';

export function RoundResultsScreen() {
  const config = useGameStore((s) => s.config);
  const currentRound = useGameStore((s) => s.currentRound);
  const currentPuzzle = useGameStore((s) => s.currentPuzzle);
  const continueFromResults = useGameStore((s) => s.continueFromResults);
  const resetToHome = useGameStore((s) => s.resetToHome);
  const roundResults = useGameStore((s) => s.roundResults);
  const practiceStatistics = useGameStore((s) => s.practiceStatistics);
  const matchStatistics = useGameStore((s) => s.matchStatistics);
  const difficultyJustAdvanced = useGameStore((s) => s.difficultyJustAdvanced);
  const players = useGameStore((s) => s.players);

  const [continueClicked, setContinueClicked] = useState(false);

  const isPractice = config.gameMode === GameMode.PRACTICE;
  const isOnline = config.gameMode === GameMode.ONLINE_MULTIPLAYER;
  const latestResult = roundResults[roundResults.length - 1];

  // Online: read which players have signalled they are ready to continue
  const onlineContinueReady = useGameStore((s) => s.onlineContinueReady);
  const playerUid = useGameStore((s) => s.playerUid);
  const onlineHostUid = useGameStore((s) => s.onlineHostUid);
  const onlineGuestUid = useGameStore((s) => s.onlineGuestUid);

  // Determine the opponent's display name for the waiting message
  const localUid = playerUid;
  const opponentUid = localUid === onlineHostUid ? onlineGuestUid : onlineHostUid;
  const opponentId = localUid === onlineHostUid ? 'player2' : 'player1';
  const opponentName = players.find(p => p.id === opponentId)?.displayName
    || (opponentId === 'player1' ? 'Player 1' : 'Player 2');

  const opponentHasClicked = isOnline && opponentUid
    ? (onlineContinueReady?.[opponentUid] === true)
    : false;

  if (!latestResult) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full">
        
        {/* Outcome banner */}
        <OutcomeBanner result={latestResult} isPractice={isPractice} currentRound={currentRound} />

        {/* Answer comparison */}
        <div className="w-full geo-panel-light flex flex-col">
          <div className="p-4 border-b-2 border-black text-center bg-white">
            <p className="text-xs font-bold text-[#555] uppercase tracking-wider mb-1">
              Correct Answer
            </p>
            <p className="text-5xl font-bold text-black tabular-nums">
              {latestResult.correctAnswer}
            </p>
          </div>
          <div className="flex divide-x-2 divide-black">
            {latestResult.playerResults.map((pr) => {
              const pState = players.find(p => p.id === pr.playerId);
              const displayName = pState?.displayName || (pr.playerId === 'player1' ? 'Player 1' : 'Player 2');
              const score = matchStatistics?.playerStatistics.find(ps => ps.playerId === pr.playerId)?.roundWins || 0;
              return (
                <PlayerResultColumn
                  key={pr.playerId}
                  result={pr}
                  isWinner={latestResult.winnerId === pr.playerId}
                  displayName={displayName}
                  score={score}
                  isPractice={isPractice}
                />
              );
            })}
          </div>
        </div>

        {/* Seed display */}
        {currentPuzzle && (
          <div className="text-[10px] text-gray-500 font-mono tracking-widest text-center uppercase">
            Seed: {currentPuzzle.metadata.seed}
          </div>
        )}

        {/* Difficulty advancement notice */}
        {difficultyJustAdvanced && isPractice && (
          <div className="w-full border-2 border-[#F59E0B] bg-[#F59E0B]/10 px-5 py-3 text-center shadow-[4px_4px_0px_0px_#F59E0B]">
            <p className="text-sm font-bold text-[#F59E0B] uppercase tracking-wide">
              Difficulty increased → {config.difficulty === Difficulty.MEDIUM ? 'Medium' : 'Hard'}
            </p>
          </div>
        )}

        {/* Practice statistics */}
        {isPractice && practiceStatistics && (
          <div className="w-full border-2 border-black bg-white p-5 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-bold text-black uppercase tracking-wider text-center">
              Session Stats
            </p>
            <div className="grid grid-cols-3 gap-3">
              <StatCell label="Acc" value={`${practiceStatistics.accuracyPercentage}%`} />
              <StatCell label="Solved" value={String(practiceStatistics.totalPuzzlesSolved)} />
              <StatCell label="Streak" value={String(practiceStatistics.currentStreak)} />
              <StatCell label="Avg" value={practiceStatistics.averageResponseTime !== null ? `${practiceStatistics.averageResponseTime.toFixed(1)}s` : '—'} />
              <StatCell label="Correct" value={String(practiceStatistics.correctAnswers)} highlight="success" />
              <StatCell label="Incorrect" value={String(practiceStatistics.incorrectAnswers)} highlight={practiceStatistics.incorrectAnswers > 0 ? 'error' : undefined} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-4 mt-2">
          <button
            onClick={() => {
              if (isOnline) setContinueClicked(true);
              continueFromResults();
            }}
            disabled={continueClicked}
            className={`geo-button w-full py-4 text-lg uppercase ${continueClicked ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {continueClicked
              ? `Waiting for ${opponentName}...`
              : opponentHasClicked
                ? `${opponentName} is waiting — Continue`
                : isPractice ? 'Next Puzzle' : 'Continue'}
          </button>
          
          <button
            onClick={resetToHome}
            className="geo-button-secondary w-full py-3 text-sm uppercase"
          >
            Quit to Home
          </button>
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Press Space to continue
        </p>
      </div>
    </div>
  );
}

function OutcomeBanner({ result, isPractice, currentRound }: { result: RoundResult; isPractice: boolean; currentRound: number; }) {
  if (isPractice) {
    const p1 = result.playerResults[0];
    const isCorrect = p1?.isCorrect;
    return (
      <div
        className={`w-full border-2 p-6 text-center ${
          isCorrect
            ? 'bg-[#B8FF2C] border-black text-black shadow-[6px_6px_0px_0px_#000]'
            : 'bg-[#EF4444] border-black text-white shadow-[6px_6px_0px_0px_#000]'
        }`}
      >
        <p className="text-3xl font-bold uppercase tracking-widest mb-1">
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </p>
        <p className={`text-sm font-bold uppercase tracking-wide ${isCorrect ? 'text-[#333]' : 'text-[#FFAAAA]'}`}>
          Round {currentRound}
        </p>
      </div>
    );
  }

  // Multiplayer banner
  const winner = result.winnerId;
  const isDraw = winner === null;
  const isP1 = winner === 'player1';
  
  const players = useGameStore.getState().players;
  const p1Name = players.find(p => p.id === 'player1')?.displayName || 'Player 1';
  const p2Name = players.find(p => p.id === 'player2')?.displayName || 'Player 2';
  const winnerName = isP1 ? p1Name : p2Name;

  return (
    <div
      className={`w-full border-2 p-6 text-center shadow-[6px_6px_0px_0px_#000] ${
        isDraw
          ? 'bg-white border-black text-black'
          : 'bg-[#B8FF2C] border-black text-black'
      }`}
    >
      <p className="text-3xl font-bold uppercase tracking-widest mb-1">
        {isDraw ? 'Draw' : `${winnerName} Wins`}
      </p>
      <p className="text-sm font-bold uppercase tracking-wide text-[#333]">
        Round {currentRound}
      </p>
    </div>
  );
}

function PlayerResultColumn({ 
  result, 
  isWinner, 
  displayName, 
  score,
  isPractice
}: { 
  result: PlayerRoundResult; 
  isWinner: boolean; 
  displayName: string;
  score: number;
  isPractice: boolean;
}) {
  return (
    <div className={`flex-1 p-5 text-center flex flex-col justify-between ${isWinner ? 'bg-[#E8FFB3]' : 'bg-[#F0F0F0]'}`}>
      <div>
        <p className="text-xs font-bold text-[#555] uppercase tracking-wider mb-2">
          {displayName}
        </p>
        <p className={`text-4xl font-bold tabular-nums mb-4 ${
          result.isCorrect ? 'text-black' : 'text-[#EF4444]'
        }`}>
          {result.answer}
        </p>
        <div className="flex flex-col items-center gap-1 bg-black text-[#B8FF2C] py-1 border border-black shadow-[2px_2px_0px_0px_#000]">
          <span className="text-[10px] uppercase tracking-widest text-[#B8FF2C]">Time</span>
          <span className="text-sm font-bold tabular-nums">
            {result.answerTime.toFixed(2)}s
          </span>
        </div>
      </div>
      
      {!isPractice && (
        <div className="mt-4 pt-4 border-t-2 border-black/10">
          <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-1">
            Match Score
          </p>
          <p className="text-xl font-bold tabular-nums">
            {score}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: 'success' | 'error' }) {
  const valueColor = highlight === 'success' ? 'text-[#3E8B15]' : highlight === 'error' ? 'text-[#EF4444]' : 'text-black';
  return (
    <div className="bg-gray-50 border-2 border-black p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-lg font-bold tabular-nums ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}
