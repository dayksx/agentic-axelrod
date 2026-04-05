"use client";

import { create } from "zustand";
import type { OrganizedTournament, TimelineState } from "@/types/models";
import { deriveState } from "@/lib/timeline";

const AUTO_PLAY_MS = 800;
const SEALED_PAUSE_MS = 1500;
const ANNOUNCEMENT_PAUSE_MS = 2500;

interface TimeState {
  currentStep: number;
  isPlaying: boolean;
  totalSteps: number;
  tournamentData: OrganizedTournament | null;
  derived: TimelineState | null;
  balances: Map<number, string> | null;

  loadTournament: (data: OrganizedTournament) => void;
  loadBalances: (balances: Map<number, string>) => void;
  forward: () => void;
  back: () => void;
  play: () => void;
  pause: () => void;
  jumpTo: (step: number) => void;
}

let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (autoPlayTimer !== null) {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function scheduleNext(get: () => TimeState) {
  clearTimer();
  const state = get();
  if (!state.isPlaying || !state.tournamentData) return;

  const phase = state.derived?.phase;
  const delay =
    phase === "announcement"
      ? ANNOUNCEMENT_PAUSE_MS
      : phase === "decision_sealed"
        ? SEALED_PAUSE_MS
        : AUTO_PLAY_MS;

  autoPlayTimer = setTimeout(() => {
    const current = get();
    if (!current.isPlaying) return;
    current.forward();
  }, delay);
}

function derive(step: number, data: OrganizedTournament | null): TimelineState | null {
  if (!data) return null;
  return deriveState(step, data);
}

export const useTimeStore = create<TimeState>((set, get) => ({
  currentStep: 0,
  isPlaying: false,
  totalSteps: 0,
  tournamentData: null,
  derived: null,
  balances: null,

  loadBalances: (balances) => {
    set({ balances });
  },

  loadTournament: (data) => {
    clearTimer();
    set({
      tournamentData: data,
      totalSteps: data.totalSteps,
      currentStep: 0,
      isPlaying: false,
      derived: derive(0, data),
    });
  },

  forward: () => {
    const { currentStep, totalSteps, tournamentData, isPlaying } = get();
    const next = Math.min(currentStep + 1, totalSteps - 1);
    if (next === currentStep && next === totalSteps - 1) {
      clearTimer();
      set({ isPlaying: false });
      return;
    }
    set({ currentStep: next, derived: derive(next, tournamentData) });
    if (isPlaying) scheduleNext(get);
  },

  back: () => {
    const { currentStep, tournamentData } = get();
    const prev = Math.max(currentStep - 1, 0);
    set({ currentStep: prev, derived: derive(prev, tournamentData) });
  },

  play: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep >= totalSteps - 1) return;
    set({ isPlaying: true });
    scheduleNext(get);
  },

  pause: () => {
    clearTimer();
    set({ isPlaying: false });
  },

  jumpTo: (step) => {
    const { totalSteps, tournamentData } = get();
    const clamped = Math.max(0, Math.min(step, totalSteps - 1));
    set({ currentStep: clamped, derived: derive(clamped, tournamentData) });
  },
}));
