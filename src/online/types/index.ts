export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface PlayerInfo {
  displayName: string;
  isHost: boolean;
  isReady: boolean;
}

export interface PresenceInfo {
  status: 'online' | 'offline';
  lastSeen: number;
}

export interface RoomConfig {
  roomCode: string;
  hostUid: string;
  hostDisplayName: string;
  createdAt: number;
  lastActivity: number;
  status: RoomStatus;
  protocolVersion: number;
}

export interface OnlinePlayerSubmission {
  answer: number;
  elapsedTime: number;
  timestamp: number;
  roundNumber: number;
}

export interface RoundInfo {
  roundNumber: number;
  puzzleSeed: number;
  difficulty: string; // Difficulty enum
  displayStartTime: number | null;
  answerDeadline: number | null;
}

export interface MatchState {
  syncState?: 'synchronizing' | 'countdown' | 'playing';
  clientsReady?: Record<string, boolean>;
  continueReady?: Record<string, boolean>;
  countdownStartTime?: number | null;
  currentRoundInfo: RoundInfo | null;
  submissions: Record<string, OnlinePlayerSubmission>;
  disconnectedPlayerUid: string | null;
  disconnectTimestamp: number | null;
  matchEnded: boolean;
}

export interface RoomData {
  config: RoomConfig;
  players: Record<string, PlayerInfo>;
  presence: Record<string, PresenceInfo>;
  matchState?: MatchState;
}
