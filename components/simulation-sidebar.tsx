"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { runPythonSimulation } from "@/lib/python-simulation"
import { useSimulationStore } from "@/lib/simulation-store"

const formSchema = z.object({
  // General Settings
  randomSeed: z.coerce.number().int().default(42),
  nSimulations: z.coerce.number().int().min(1).max(1000).default(100),
  nObservations: z.coerce
    .number()
    .int()
    .min(100)
    .max(1000000)
    .default(60 * 24 * 7 * 26), // 60*24*7*26
  basePrice: z.coerce.number().min(1).default(2000),
  nCurrencies: z.coerce.number().int().min(1).max(20).default(5),
  transactionFee: z.coerce.number().min(0).max(1).default(0.0006), // 0.06%

  // Trend & Volatility
  variance: z.coerce
    .number()
    .min(0)
    .max(1)
    .default(0.012 * 0.012), // 0.012^2
  covariance: z.coerce
    .number()
    .min(0)
    .max(1)
    .default(0.007 * 0.007), // 0.007^2
  volatility: z.coerce.number().min(0.1).max(20).default(3),
  volatilityCovariance: z.coerce.number().min(0.1).max(10).default(1.75),

  // Extreme Events
  extremeEventProbability: z.coerce.number().min(0).max(1).default(0.05),
  extremeEventVariance: z.coerce.number().min(1).max(10000).default(500),
  extremeEventCovariance: z.coerce.number().min(1).max(10000).default(450),
  extremeEventDuration: z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .default(60 * 24), // 60*24 (one day)
})

export function SimulationSidebar() {
  const [isRunning, setIsRunning] = useState(false)
  const setSimulationResults = useSimulationStore((state) => state.setResults)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      randomSeed: 2151,
      nSimulations: 100,
      nObservations: 60 * 24 * 7 * 26,
      basePrice: 2000,
      nCurrencies: 5,
      transactionFee: 0.0006,
      variance: 0.012 * 0.012,
      covariance: 0.007 * 0.007,
      volatility: 3,
      volatilityCovariance: 1.75,
      extremeEventProbability: 0.05,
      extremeEventVariance: 500,
      extremeEventCovariance: 450,
      extremeEventDuration: 60 * 24,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsRunning(true)
    try {
      console.log("Running Python simulation with parameters:", values)
      const results = await runPythonSimulation(values)
      console.log("Python simulation results:", results)
      setSimulationResults(results)
    } catch (error) {
      console.error("Error running Python simulation:", error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-900 overflow-y-auto">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold">Simulation Parameters</h1>
        <p className="text-sm text-slate-400 mt-1">Python-powered Monte Carlo simulation</p>
      </div>

      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Settings Card */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="randomSeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Random Seed</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-slate-900" />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        Seed for reproducible results (default: 2151)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nSimulations"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Number of Simulations</FormLabel>
                        <span className="text-sm text-slate-400">{value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1}
                          max={1000}
                          step={1}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">N_SIMULATIONS (default: 100)</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nObservations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Observations</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-slate-900" />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        N_OBSERVATIONS: 60*24*7*26 = {60 * 24 * 7 * 26} (26 weeks of minute data)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-slate-900" />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">BASE_PRICE (default: 2000)</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nCurrencies"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Number of Currencies</FormLabel>
                        <span className="text-sm text-slate-400">{value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1}
                          max={20}
                          step={1}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">N_CURRENCIES (default: 5)</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Fee</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.0001" {...field} className="bg-slate-900" />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        TRANSACTION_FEE: 0.06% = 0.0006 (default)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Trend & Volatility Card */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Trend & Volatility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="variance"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Variance</FormLabel>
                        <span className="text-sm text-slate-400">{value.toFixed(6)}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={0.01}
                          step={0.000001}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        VARIANCE: 0.012² = {(0.012 * 0.012).toFixed(6)} (default)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="covariance"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Covariance</FormLabel>
                        <span className="text-sm text-slate-400">{value.toFixed(6)}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={0.01}
                          step={0.000001}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        COVARIANCE: 0.007² = {(0.007 * 0.007).toFixed(6)} (default)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volatility"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Volatility</FormLabel>
                        <span className="text-sm text-slate-400">{value.toFixed(2)}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0.1}
                          max={20}
                          step={0.1}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">VOLATILITY (default: 3)</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volatilityCovariance"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Volatility Covariance</FormLabel>
                        <span className="text-sm text-slate-400">{value.toFixed(2)}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0.1}
                          max={10}
                          step={0.05}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        VOLATILITY_COVARIANCE (default: 1.75)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Extreme Events Card */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Extreme Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="extremeEventProbability"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Extreme Event Probability</FormLabel>
                        <span className="text-sm text-slate-400">{(value * 100).toFixed(1)}%</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        EXTREME_EVENT_PROBABILITY (default: 0.05 = 5%)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extremeEventVariance"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Extreme Event Variance</FormLabel>
                        <span className="text-sm text-slate-400">{value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10000}
                          step={10}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        EXTREME_EVENT_VARIANCE (default: 500)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extremeEventCovariance"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Extreme Event Covariance</FormLabel>
                        <span className="text-sm text-slate-400">{value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10000}
                          step={10}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        EXTREME_EVENT_COVARIANCE (default: 450)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extremeEventDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extreme Event Duration</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-slate-900" />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        EXTREME_EVENT_DURATION: 60*24 = {60 * 24} minutes (one day)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isRunning}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isRunning ? (
                "Running Python Simulation..."
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Run Python Simulation
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </aside>
  )
}
