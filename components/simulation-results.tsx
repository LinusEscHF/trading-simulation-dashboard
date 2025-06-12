"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import { AlertCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSimulationStore } from "@/lib/simulation-store"
import { formatNumber } from "@/lib/utils"

// Register Chart.js components
Chart.register(...registerables)

interface SimulationResultsProps {
  selectedSimulation: number
  onSelectSimulation: (index: number) => void
}

export function SimulationResults({ selectedSimulation, onSelectSimulation }: SimulationResultsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const results = useSimulationStore((state) => state.results)

  useEffect(() => {
    if (!results || !chartRef.current) return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    try {
      // Get the selected simulation data
      const simData = results.simulations[selectedSimulation]
      if (!simData) return

      // Create labels for time steps
      const labels = Array.from({ length: simData.prices[0].length }, (_, i) => i)

      // Create datasets for chart - one for each currency
      const datasets = simData.prices.map((priceSeries, i) => ({
        label: `Currency ${i + 1}`,
        data: priceSeries,
        borderColor: getColorForIndex(i),
        backgroundColor: getColorForIndex(i, 0.1),
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
      }))

      // Create chart
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: "#f8fafc", // slate-50
                font: {
                  family: "Inter, sans-serif",
                },
              },
            },
            tooltip: {
              mode: "index",
              intersect: false,
              backgroundColor: "#1e293b", // slate-800
              titleColor: "#f8fafc", // slate-50
              bodyColor: "#f8fafc", // slate-50
              borderColor: "#475569", // slate-600
              borderWidth: 1,
            },
            title: {
              display: true,
              text: "Simulated Price History",
              color: "#f8fafc", // slate-50
              font: {
                size: 16,
                family: "Inter, sans-serif",
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Time Step",
                color: "#cbd5e1", // slate-300
              },
              grid: {
                color: "#334155", // slate-700
                tickColor: "#475569", // slate-600
              },
              ticks: {
                color: "#cbd5e1", // slate-300
              },
            },
            y: {
              title: {
                display: true,
                text: "Price",
                color: "#cbd5e1", // slate-300
              },
              grid: {
                color: "#334155", // slate-700
                tickColor: "#475569", // slate-600
              },
              ticks: {
                color: "#cbd5e1", // slate-300
              },
            },
          },
        },
      })
    } catch (error) {
      console.error("Error rendering chart:", error)
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [results, selectedSimulation])

  // Helper function to generate colors for different currencies
  function getColorForIndex(index: number, alpha = 1) {
    const colors = [
      `rgba(59, 130, 246, ${alpha})`, // blue
      `rgba(16, 185, 129, ${alpha})`, // emerald
      `rgba(239, 68, 68, ${alpha})`, // red
      `rgba(245, 158, 11, ${alpha})`, // amber
      `rgba(168, 85, 247, ${alpha})`, // purple
      `rgba(236, 72, 153, ${alpha})`, // pink
      `rgba(20, 184, 166, ${alpha})`, // teal
      `rgba(249, 115, 22, ${alpha})`, // orange
      `rgba(139, 92, 246, ${alpha})`, // violet
      `rgba(6, 182, 212, ${alpha})`, // cyan
    ]
    return colors[index % colors.length]
  }

  if (!results) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Cryptocurrency Market Simulation</h1>
        </div>
        <Card className="flex-1 bg-slate-800 border-slate-700">
          <CardContent className="flex h-full items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">No Simulation Data</h3>
              <p className="text-slate-400">
                Configure parameters in the sidebar and run a simulation to see results here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get the selected simulation data
  const simData = results.simulations[selectedSimulation]
  const numSimulations = results.simulations.length

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cryptocurrency Market Simulation</h1>

        <div className="w-64">
          <Select
            value={selectedSimulation.toString()}
            onValueChange={(value) => onSelectSimulation(Number.parseInt(value))}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="Select simulation" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {Array.from({ length: numSimulations }).map((_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  Simulation {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mb-6 bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="h-[500px] w-full p-4">
            <canvas ref={chartRef} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-400">Realized Volatility</div>
                <div className="mt-1 text-xl font-semibold">{formatNumber(simData.realizedVolatility)}%</div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-400">Extreme Event</div>
                <div className="mt-1 text-xl font-semibold flex items-center">
                  {simData.extremeEvent ? (
                    <>
                      <span className="text-red-500 mr-2">Yes</span>
                      <span className="text-sm text-slate-400">(Time Index: {simData.extremeEventIndex})</span>
                    </>
                  ) : (
                    <span className="text-emerald-500">No</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Effective Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {simData.effectiveTrends.map((trend, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-700 last:border-0">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getColorForIndex(i) }}></div>
                    <span className="text-sm">Currency {i + 1}</span>
                  </div>
                  <div className={`font-medium ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {trend >= 0 ? "+" : ""}
                    {formatNumber(trend * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
