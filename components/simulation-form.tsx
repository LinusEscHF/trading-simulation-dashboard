"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { runSimulation } from "@/lib/simulation"
import { useSimulationStore } from "@/lib/simulation-store"

const formSchema = z.object({
  simulationType: z.string({
    required_error: "Please select a simulation type.",
  }),
  iterations: z.coerce
    .number()
    .int()
    .min(100, "Minimum 100 iterations required")
    .max(100000, "Maximum 100,000 iterations allowed"),
  initialValue: z.coerce.number().min(0),
  volatility: z.coerce.number().min(0).max(1),
  timeHorizon: z.coerce.number().int().min(1),
  confidenceInterval: z.coerce.number().min(0.5).max(0.99),
})

export function SimulationForm() {
  const [isRunning, setIsRunning] = useState(false)
  const setSimulationResults = useSimulationStore((state) => state.setResults)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      simulationType: "geometric-brownian-motion",
      iterations: 1000,
      initialValue: 100,
      volatility: 0.2,
      timeHorizon: 12,
      confidenceInterval: 0.95,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsRunning(true)
    try {
      console.log("Running simulation with parameters:", values)
      const results = await runSimulation(values)
      console.log("Simulation results:", results)
      setSimulationResults(results)
    } catch (error) {
      console.error("Error running simulation:", error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Simulation Parameters</CardTitle>
        <CardDescription>Configure the parameters for your Monte Carlo simulation.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="simulationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Simulation Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a simulation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="geometric-brownian-motion">Geometric Brownian Motion</SelectItem>
                      <SelectItem value="random-walk">Random Walk</SelectItem>
                      <SelectItem value="mean-reversion">Mean Reversion</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>The mathematical model used for the simulation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="iterations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Iterations</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Number of simulation paths.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Value</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>Starting value.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="volatility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volatility</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>Volatility parameter (0-1).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeHorizon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Horizon</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Number of time periods to simulate.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="confidenceInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confidence Interval</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>Confidence interval for results (0.5-0.99).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isRunning} className="w-full">
              {isRunning ? (
                "Running Simulation..."
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Run Simulation
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
