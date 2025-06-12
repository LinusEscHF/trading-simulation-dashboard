import { NextResponse } from "next/server"
import type { SimulationResult, SimulationData } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const params = await request.json()

    const {
      randomSeed,
      numSimulations,
      numObservations,
      numCurrencies,
      basePrice,
      transactionFee,
      trendVariance,
      trendCovariance,
      baseVolatility,
      volatilityCovariance,
      extremeEventProbability,
      extremeEventVariance,
      extremeEventCovariance,
      extremeEventDuration,
    } = params

    // Generate simulations using proper stochastic processes
    const simulations: SimulationData[] = []

    // Set random seed for reproducibility
    let seedState = randomSeed

    // Seeded random number generator
    function seededRandom() {
      seedState = (seedState * 9301 + 49297) % 233280
      return seedState / 233280
    }

    // Box-Muller transform for normal distribution with seed
    function seededNormalRandom() {
      let u = 0,
        v = 0
      while (u === 0) u = seededRandom()
      while (v === 0) v = seededRandom()
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    }

    for (let sim = 0; sim < numSimulations; sim++) {
      // Generate correlated trend components using Cholesky decomposition
      const trendComponents = generateMultivariateNormal(
        numCurrencies,
        0, // mean
        trendVariance,
        trendCovariance,
        seededNormalRandom,
      )

      // Generate correlated volatility components
      const volatilityComponents = generateMultivariateNormal(
        numCurrencies,
        baseVolatility / 100, // convert percentage to decimal
        (baseVolatility / 100) ** 2 * 0.1, // volatility variance
        volatilityCovariance / 10000, // covariance
        seededNormalRandom,
      ).map((v) => Math.abs(v)) // ensure positive volatility

      // Determine extreme event timing
      const extremeEvent = seededRandom() < extremeEventProbability
      const extremeEventStart = extremeEvent
        ? Math.floor(seededRandom() * (numObservations - extremeEventDuration))
        : -1

      // Generate extreme event shocks if applicable
      let extremeEventShocks: number[] = []
      if (extremeEvent) {
        extremeEventShocks = generateMultivariateNormal(
          numCurrencies,
          -0.1, // negative mean for market crash
          extremeEventVariance / 10000,
          extremeEventCovariance / 10000,
          seededNormalRandom,
        )
      }

      // Generate price paths using geometric Brownian motion with jumps
      const prices: number[][] = []
      const logPrices: number[][] = []

      for (let c = 0; c < numCurrencies; c++) {
        const initialPrice = basePrice * (0.5 + seededRandom()) // Random initial price
        const pricePath = [initialPrice]
        const logPricePath = [Math.log(initialPrice)]

        // Trend and volatility for this currency
        const mu = trendComponents[c] // drift coefficient
        const sigma = volatilityComponents[c] // volatility coefficient

        for (let t = 1; t < numObservations; t++) {
          // Standard geometric Brownian motion increment
          const dt = 1 / 252 // daily time step (assuming 252 trading days per year)
          const dW = Math.sqrt(dt) * seededNormalRandom() // Brownian motion increment

          // GBM: dS/S = μdt + σdW
          // Solution: S(t) = S(0) * exp((μ - σ²/2)t + σW(t))
          const drift = (mu - 0.5 * sigma * sigma) * dt
          const diffusion = sigma * dW

          let logReturn = drift + diffusion

          // Add extreme event shock if applicable
          if (extremeEvent && t >= extremeEventStart && t < extremeEventStart + extremeEventDuration) {
            // Apply extreme event shock with decay
            const eventProgress = (t - extremeEventStart) / extremeEventDuration
            const decayFactor = Math.exp(-3 * eventProgress) // exponential decay
            logReturn += extremeEventShocks[c] * decayFactor * dt
          }

          // Update log price and convert to price
          const newLogPrice = logPricePath[t - 1] + logReturn
          const newPrice = Math.exp(newLogPrice)

          logPricePath.push(newLogPrice)
          pricePath.push(Math.max(newPrice, 0.01)) // ensure positive prices
        }

        // Sample the path for visualization (reduce data points)
        const sampledPath = samplePath(pricePath, Math.min(500, numObservations))
        prices.push(sampledPath)
        logPrices.push(samplePath(logPricePath, Math.min(500, numObservations)))
      }

      // Calculate realized volatility using log returns
      const realizedVolatility = calculateRealizedVolatilityFromLogPrices(logPrices[0]) * 100

      // Calculate effective trends (annualized returns)
      const effectiveTrends = prices.map((pricePath) => {
        const totalReturn = pricePath[pricePath.length - 1] / pricePath[0] - 1
        const timeInYears = (pricePath.length - 1) / 252 // convert time steps to years
        return Math.pow(1 + totalReturn, 1 / timeInYears) - 1 // annualized return
      })

      simulations.push({
        prices,
        trends: trendComponents,
        volatilities: volatilityComponents,
        extremeEvent,
        extremeEventIndex: extremeEvent ? extremeEventStart : null,
        realizedVolatility,
        effectiveTrends,
      })
    }

    const results: SimulationResult = {
      simulations,
      params,
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Simulation error:", error)
    return NextResponse.json({ error: "Failed to run simulation" }, { status: 500 })
  }
}

// Generate multivariate normal random variables using Cholesky decomposition
function generateMultivariateNormal(
  n: number,
  mean: number,
  variance: number,
  covariance: number,
  randomGenerator: () => number,
): number[] {
  // Create covariance matrix
  const covMatrix: number[][] = []
  for (let i = 0; i < n; i++) {
    covMatrix[i] = []
    for (let j = 0; j < n; j++) {
      if (i === j) {
        covMatrix[i][j] = variance
      } else {
        covMatrix[i][j] = covariance
      }
    }
  }

  // Simplified Cholesky decomposition for our specific case
  const L: number[][] = []
  for (let i = 0; i < n; i++) {
    L[i] = new Array(n).fill(0)
  }

  // For our case where all diagonal elements are equal and all off-diagonal elements are equal
  const sqrtVar = Math.sqrt(variance)
  const sqrtCov = Math.sqrt(Math.max(0, covariance))

  L[0][0] = sqrtVar
  for (let i = 1; i < n; i++) {
    L[i][0] = sqrtCov
    L[i][i] = Math.sqrt(Math.max(0, variance - covariance))
  }

  // Generate independent normal random variables
  const z = []
  for (let i = 0; i < n; i++) {
    let u = 0,
      v = 0
    while (u === 0) u = randomGenerator()
    while (v === 0) v = randomGenerator()
    z.push(Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v))
  }

  // Transform to correlated variables: X = μ + L * Z
  const result = []
  for (let i = 0; i < n; i++) {
    let sum = 0
    for (let j = 0; j <= i; j++) {
      sum += L[i][j] * z[j]
    }
    result.push(mean + sum)
  }

  return result
}

// Calculate realized volatility from log prices
function calculateRealizedVolatilityFromLogPrices(logPrices: number[]): number {
  const logReturns = []
  for (let i = 1; i < logPrices.length; i++) {
    logReturns.push(logPrices[i] - logPrices[i - 1])
  }

  // Calculate sample standard deviation
  const mean = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length
  const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (logReturns.length - 1)
  const stdDev = Math.sqrt(variance)

  // Annualize (assuming daily data, 252 trading days per year)
  return stdDev * Math.sqrt(252)
}

// Create a pseudo-random number generator with a seed
function createPseudoRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

// Helper function to generate a random number from a standard normal distribution
function generateNormalRandom(): number {
  let u = 0,
    v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()

  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

// Helper function to generate correlated random numbers
function generateCorrelatedRandoms(n: number, mean: number, variance: number, covariance: number): number[] {
  // For simplicity, we'll use a basic approach to generate correlated random numbers
  // In a real implementation, you might want to use Cholesky decomposition

  const commonFactor = generateNormalRandom() * Math.sqrt(covariance)
  const result = []

  for (let i = 0; i < n; i++) {
    const idiosyncratic = generateNormalRandom() * Math.sqrt(variance - covariance)
    result.push(mean + commonFactor + idiosyncratic)
  }

  return result
}

// Helper function to calculate realized volatility
function calculateRealizedVolatility(prices: number[]): number {
  const returns = []
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]))
  }

  // Calculate standard deviation of returns
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)

  // Annualize (assuming daily data)
  return stdDev * Math.sqrt(252)
}

// Helper function to sample a path to reduce data points
function samplePath(path: number[], targetLength: number): number[] {
  if (path.length <= targetLength) return path

  const result = []
  const step = path.length / targetLength

  for (let i = 0; i < targetLength; i++) {
    const index = Math.min(Math.floor(i * step), path.length - 1)
    result.push(path[index])
  }

  return result
}
