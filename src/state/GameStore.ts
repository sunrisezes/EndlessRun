import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameState {
  highScore: number;
  totalCoins: number;
  currentDistance: number;
  currentCoins: number;
  
  updateCurrentRun: (distance: number, coins: number) => void;
  recordRunEnd: () => void;
  resetCurrentRun: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      highScore: 0,
      totalCoins: 0,
      currentDistance: 0,
      currentCoins: 0,

      updateCurrentRun: (distance: number, coins: number) => {
        set({
          currentDistance: Math.max(0, distance),
          currentCoins: Math.max(0, coins),
        });
      },

      recordRunEnd: () => {
        const { currentDistance, currentCoins, highScore, totalCoins } = get();
        const newHighScore = Math.max(highScore, currentDistance);
        const newTotalCoins = totalCoins + currentCoins;

        set({
          highScore: newHighScore,
          totalCoins: newTotalCoins,
        });
      },

      resetCurrentRun: () => {
        set({
          currentDistance: 0,
          currentCoins: 0,
        });
      },
    }),
    {
      name: 'endless_runner_3d_storage', // localStorage key
      partialize: (state) => ({
        highScore: state.highScore,
        totalCoins: state.totalCoins,
      }),
    }
  )
);
