"use client"

import { create } from "zustand"
import type { SimulationResult } from "./types"

interface SimulationStore {
  results: SimulationResult | null
  setResults: (results: SimulationResult) => void
  isPyodideReady: boolean
  setIsPyodideReady: (isReady: boolean) => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  results: null,
  setResults: (results) => set({ results }),
  isPyodideReady: false,
  setIsPyodideReady: (isReady: boolean) => set({ isPyodideReady: isReady }),
}))
