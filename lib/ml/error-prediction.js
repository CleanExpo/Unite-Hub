import { createClient } from "@supabase/supabase-js"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"
import os from "os"

// Convert exec to Promise-based
const execAsync = promisify(exec)

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Fetches historical error data from the database
 * @param {number} days - Number of days of historical data to fetch
 * @returns {Promise<Array>} - Array of error data points
 */
async function fetchHistoricalErrorData(days = 90) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase.rpc("get_daily_error_counts", {
    start_date: startDate.toISOString(),
    end_date: new Date().toISOString(),
  })

  if (error) {
    console.error("Error fetching historical data:", error)
    throw new Error("Failed to fetch historical error data")
  }

  return data
}

/**
 * Prepares data for Prophet model
 * @param {Array} data - Raw error data from database
 * @returns {string} - Path to CSV file with prepared data
 */
async function prepareDataForProphet(data) {
  // Create a temporary directory for our files
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "error-prediction-"))
  const csvPath = path.join(tempDir, "error_data.csv")

  // Format data for Prophet (requires 'ds' for dates and 'y' for values)
  const csvContent = "ds,y\n" + data.map((item) => `${item.date},${item.total_count}`).join("\n")

  await fs.writeFile(csvPath, csvContent)
  return { csvPath, tempDir }
}

/**
 * Runs Prophet prediction model using Python
 * @param {string} inputCsvPath - Path to input CSV file
 * @param {string} tempDir - Temporary directory for output
 * @param {number} forecastDays - Number of days to forecast
 * @returns {Promise<Array>} - Prediction results
 */
async function runProphetModel(inputCsvPath, tempDir, forecastDays = 30) {
  const outputPath = path.join(tempDir, "forecast.json")

  // Create a Python script to run Prophet
  const pythonScriptPath = path.join(tempDir, "run_prophet.py")
  const pythonScript = `
import pandas as pd
from prophet import Prophet
import json

# Load the data
df = pd.read_csv('${inputCsvPath.replace(/\\/g, "\\\\")}')

# Initialize and fit the model
model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=True,
    seasonality_mode='multiplicative'
)
model.fit(df)

# Create future dataframe for prediction
future = model.make_future_dataframe(periods=${forecastDays})
forecast = model.predict(future)

# Prepare results
results = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(${forecastDays}).to_dict('records')
for item in results:
    item['ds'] = item['ds'].strftime('%Y-%m-%d')

# Save to JSON
with open('${outputPath.replace(/\\/g, "\\\\")}', 'w') as f:
    json.dump(results, f)
`

  await fs.writeFile(pythonScriptPath, pythonScript)

  try {
    // Run the Python script
    await execAsync("pip install prophet pandas")
    await execAsync(`python ${pythonScriptPath}`)

    // Read the results
    const forecastData = await fs.readFile(outputPath, "utf8")
    return JSON.parse(forecastData)
  } catch (error) {
    console.error("Error running Prophet model:", error)
    throw new Error("Failed to run prediction model")
  } finally {
    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (cleanupError) {
      console.error("Error cleaning up temp files:", cleanupError)
    }
  }
}

/**
 * Generates error predictions using Prophet
 * @param {number} historyDays - Days of historical data to use
 * @param {number} forecastDays - Days to forecast into the future
 * @returns {Promise<Object>} - Prediction results and metadata
 */
export async function predictErrorPatterns(historyDays = 90, forecastDays = 30) {
  try {
    // Fetch historical data
    const historicalData = await fetchHistoricalErrorData(historyDays)

    // Check if we have enough data
    if (historicalData.length < 14) {
      throw new Error("Insufficient historical data for prediction (need at least 14 data points)")
    }

    // Prepare data for Prophet
    const { csvPath, tempDir } = await prepareDataForProphet(historicalData)

    // Run Prophet model
    const predictions = await runProphetModel(csvPath, tempDir, forecastDays)

    // Format the results
    const formattedPredictions = predictions.map((item) => ({
      date: item.ds,
      predicted: Math.max(0, Math.round(item.yhat)), // Ensure no negative predictions
      lowerBound: Math.max(0, Math.round(item.yhat_lower)),
      upperBound: Math.max(0, Math.round(item.yhat_upper)),
    }))

    // Calculate some metadata about the prediction
    const totalPredicted = formattedPredictions.reduce((sum, item) => sum + item.predicted, 0)
    const avgDaily = totalPredicted / forecastDays
    const peakDay = formattedPredictions.reduce(
      (max, item) => (item.predicted > max.predicted ? item : max),
      formattedPredictions[0],
    )

    return {
      predictions: formattedPredictions,
      metadata: {
        historyDays,
        forecastDays,
        totalPredicted,
        avgDaily,
        peakDay,
      },
    }
  } catch (error) {
    console.error("Error in error prediction:", error)
    throw error
  }
}

// If this file is run directly, execute a test prediction
if (require.main === module) {
  predictErrorPatterns()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((err) => console.error("Prediction failed:", err))
}
