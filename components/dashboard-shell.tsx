"use client"

import { useState } from "react"
import { SimulationSidebar } from "@/components/simulation-sidebar"
import { SimulationResults } from "@/components/simulation-results"
import { ThemeProvider } from "@/components/theme-provider"

export function DashboardShell() {
  const [selectedSimulation, setSelectedSimulation] = useState(0)

  return (
    <ThemeProvider defaultTheme="dark" storageKey="crypto-sim-theme">
      <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans">
        <SimulationSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <SimulationResults selectedSimulation={selectedSimulation} onSelectSimulation={setSelectedSimulation} />
        </main>
      </div>
    </ThemeProvider>
  )
}
