import type { SimulationResult } from "./types"

interface PythonSimulationParams {
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

// Caching the instance is a good performance practice
let pyodideInstance: any = null

async function loadPyodide() {
  if (pyodideInstance) {
    return pyodideInstance
  }

  // Define window.process to trick the environment detection
  (window as any).process = {
    browser: true,
    env: { NODE_ENV: 'development' }
  };

  console.log("Loading Pyodide engine...")
  const pyodide = await (window as any).loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
  })

  console.log("Installing Python packages...")
  await pyodide.loadPackage(["numpy", "scipy", "pandas"])
  
  pyodideInstance = pyodide
  console.log("✅ Pyodide engine and packages are ready.")
  return pyodide
}

export async function runPythonSimulation(params: PythonSimulationParams): Promise<SimulationResult> {
  try {
    const pyodide = await loadPyodide()
    
    // Set parameters and run Python code as before
    pyodide.globals.set("RANDOM_SEED", params.randomSeed)
    pyodide.globals.set("N_SIMULATIONS", params.nSimulations)
    pyodide.globals.set("N_OBSERVATIONS", params.nObservations)
    pyodide.globals.set("BASE_PRICE", params.basePrice)
    pyodide.globals.set("N_CURRENCIES", params.nCurrencies)
    pyodide.globals.set("TRANSACTION_FEE", params.transactionFee)
    pyodide.globals.set("VARIANCE", params.variance)
    pyodide.globals.set("COVARIANCE", params.covariance)
    pyodide.globals.set("VOLATILITY", params.volatility)
    pyodide.globals.set("VOLATILITY_COVARIANCE", params.volatilityCovariance)
    pyodide.globals.set("EXTREME_EVENT_PROBABILITY", params.extremeEventProbability)
    pyodide.globals.set("EXTREME_EVENT_VARIANCE", params.extremeEventVariance)
    pyodide.globals.set("EXTREME_EVENT_COVARIANCE", params.extremeEventCovariance)
    pyodide.globals.set("EXTREME_EVENT_DURATION", params.extremeEventDuration)
    
    const pythonCode = `
# ... your full python script remains here ...
import numpy as np
import pandas as pd
from scipy.stats import multivariate_normal
import json

# Set random seed for reproducibility
np.random.seed(RANDOM_SEED)

def generate_correlated_trends(n_currencies, variance, covariance):
    """Generate correlated trend components for multiple currencies"""
    # Create covariance matrix
    cov_matrix = np.full((n_currencies, n_currencies), covariance)
    np.fill_diagonal(cov_matrix, variance)
    
    # Generate correlated random trends
    trends = np.random.multivariate_normal(
        mean=np.zeros(n_currencies),
        cov=cov_matrix,
        size=1
    )[0]
    
    return trends

def generate_correlated_volatilities(n_currencies, base_volatility, volatility_covariance):
    """Generate correlated volatility components for multiple currencies"""
    # Create covariance matrix for volatilities
    vol_variance = (base_volatility * 0.1) ** 2  # 10% of base volatility as variance
    cov_matrix = np.full((n_currencies, n_currencies), volatility_covariance / 10000)
    np.fill_diagonal(cov_matrix, vol_variance)
    
    # Generate correlated volatilities (ensure positive)
    volatilities = np.abs(np.random.multivariate_normal(
        mean=np.full(n_currencies, base_volatility / 100),  # Convert to decimal
        cov=cov_matrix,
        size=1
    )[0])
    
    return volatilities

def simulate_extreme_event(n_currencies, extreme_event_variance, extreme_event_covariance):
    """Generate extreme event shocks"""
    # Create covariance matrix for extreme events
    cov_matrix = np.full((n_currencies, n_currencies), extreme_event_covariance / 10000)
    np.fill_diagonal(cov_matrix, extreme_event_variance / 10000)
    
    # Generate extreme event shocks (negative mean for market crash)
    shocks = np.random.multivariate_normal(
        mean=np.full(n_currencies, -0.1),  # Negative mean for crash
        cov=cov_matrix,
        size=1
    )[0]
    
    return shocks

def simulate_price_paths(n_currencies, n_observations, base_price, trends, volatilities, 
                        extreme_event_prob, extreme_event_variance, extreme_event_covariance, 
                        extreme_event_duration):
    """Simulate price paths using geometric Brownian motion with extreme events"""
    
    # Initialize price paths
    prices = np.zeros((n_currencies, n_observations))
    
    # Set initial prices (random around base price)
    initial_prices = base_price * (0.5 + np.random.random(n_currencies))
    prices[:, 0] = initial_prices
    
    # Determine if extreme event occurs
    extreme_event = np.random.random() < extreme_event_prob
    extreme_event_start = -1
    extreme_event_shocks = None
    
    if extreme_event:
        extreme_event_start = np.random.randint(0, n_observations - extreme_event_duration)
        extreme_event_shocks = simulate_extreme_event(n_currencies, extreme_event_variance, extreme_event_covariance)
    
    # Time step (assuming minute data, convert to years)
    dt = 1 / (365 * 24 * 60)  # minutes to years
    
    # Generate price paths
    for t in range(1, n_observations):
        for c in range(n_currencies):
            # Standard GBM parameters
            mu = trends[c]  # drift
            sigma = volatilities[c]  # volatility
            
            # Generate random shock
            dW = np.sqrt(dt) * np.random.normal()
            
            # GBM increment: dS/S = μdt + σdW
            drift = (mu - 0.5 * sigma**2) * dt
            diffusion = sigma * dW
            
            log_return = drift + diffusion
            
            # Add extreme event shock if applicable
            if extreme_event and extreme_event_start <= t < extreme_event_start + extreme_event_duration:
                # Apply shock with exponential decay
                event_progress = (t - extreme_event_start) / extreme_event_duration
                decay_factor = np.exp(-3 * event_progress)
                log_return += extreme_event_shocks[c] * decay_factor * dt
            
            # Update price: S(t) = S(t-1) * exp(log_return)
            prices[c, t] = prices[c, t-1] * np.exp(log_return)
            
            # Ensure positive prices
            prices[c, t] = max(prices[c, t], 0.01)
    
    return prices, extreme_event, extreme_event_start

def calculate_realized_volatility(prices):
    """Calculate realized volatility from price series"""
    log_returns = np.diff(np.log(prices))
    return np.std(log_returns) * np.sqrt(365 * 24 * 60)  # Annualize for minute data

def calculate_effective_trends(prices):
    """Calculate effective trends (annualized returns)"""
    total_returns = prices[:, -1] / prices[:, 0] - 1
    time_in_years = prices.shape[1] / (365 * 24 * 60)  # Convert minutes to years
    annualized_returns = (1 + total_returns) ** (1 / time_in_years) - 1
    return annualized_returns

def downsample_prices(prices, target_length=500):
    """Downsample price series for visualization"""
    n_currencies, n_observations = prices.shape
    if n_observations <= target_length:
        return prices
    
    # Calculate step size
    step = n_observations / target_length
    indices = np.round(np.arange(0, n_observations, step)).astype(int)
    indices = indices[indices < n_observations]
    
    return prices[:, indices]

# Run the simulation
print("Starting Monte Carlo simulation...")

# Storage for all simulations
all_simulations = []

for sim in range(N_SIMULATIONS):
    print(f"Running simulation {sim + 1}/{N_SIMULATIONS}")
    
    # Generate correlated components
    trends = generate_correlated_trends(N_CURRENCIES, VARIANCE, COVARIANCE)
    volatilities = generate_correlated_volatilities(N_CURRENCIES, VOLATILITY, VOLATILITY_COVARIANCE)
    
    # Simulate price paths
    prices, extreme_event, extreme_event_start = simulate_price_paths(
        N_CURRENCIES, N_OBSERVATIONS, BASE_PRICE, trends, volatilities,
        EXTREME_EVENT_PROBABILITY, EXTREME_EVENT_VARIANCE, EXTREME_EVENT_COVARIANCE,
        EXTREME_EVENT_DURATION
    )
    
    # Downsample for visualization
    downsampled_prices = downsample_prices(prices, 500)
    
    # Calculate metrics
    realized_volatility = calculate_realized_volatility(prices[0]) * 100  # Convert to percentage
    effective_trends = calculate_effective_trends(prices)
    
    # Store simulation results
    simulation_data = {
        'prices': downsampled_prices.tolist(),
        'trends': trends.tolist(),
        'volatilities': volatilities.tolist(),
        'extremeEvent': bool(extreme_event),
        'extremeEventIndex': int(extreme_event_start) if extreme_event else None,
        'realizedVolatility': float(realized_volatility),
        'effectiveTrends': effective_trends.tolist()
    }
    
    all_simulations.append(simulation_data)

# Prepare final results
results = {
    'simulations': all_simulations,
    'params': {
        'randomSeed': RANDOM_SEED,
        'nSimulations': N_SIMULATIONS,
        'nObservations': N_OBSERVATIONS,
        'basePrice': BASE_PRICE,
        'nCurrencies': N_CURRENCIES,
        'transactionFee': TRANSACTION_FEE,
        'variance': VARIANCE,
        'covariance': COVARIANCE,
        'volatility': VOLATILITY,
        'volatilityCovariance': VOLATILITY_COVARIANCE,
        'extremeEventProbability': EXTREME_EVENT_PROBABILITY,
        'extremeEventVariance': EXTREME_EVENT_VARIANCE,
        'extremeEventCovariance': EXTREME_EVENT_COVARIANCE,
        'extremeEventDuration': EXTREME_EVENT_DURATION
    }
}

print("Simulation completed!")
simulation_results = results
`

    const results = await pyodide.runPythonAsync(pythonCode)
    return pyodide.globals.get("simulation_results").toJs({ dict_converter: Object.fromEntries })

  } catch (error) {
    console.error("Error running Python simulation:", error)
    throw new Error(`Python simulation failed: ${error}`)
  }
}
