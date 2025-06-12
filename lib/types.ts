export interface SimulationResult {
  simulations: SimulationData[]
  params: {
    randomSeed: number
    nSimulations: number
    nObservations: number
    basePrice: number
    nCurrencies: number
    transactionFee: number
    variance: number
    covariance: number
    volatility: number
    volatilityCovariance: number
    extremeEventProbability: number
    extremeEventVariance: number
    extremeEventCovariance: number
    extremeEventDuration: number
  }
}

export interface SimulationData {
  prices: number[][] // Array of price series for each currency
  trends: number[] // Trend for each currency
  volatilities: number[] // Volatility for each currency
  extremeEvent: boolean // Whether an extreme event occurred
  extremeEventIndex: number | null // Time index when extreme event started
  realizedVolatility: number // Realized volatility
  effectiveTrends: number[] // Effective trend for each currency
}
