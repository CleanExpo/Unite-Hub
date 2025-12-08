# Phase E41: Predictive Governance Forecaster

**Status**: In Progress
**Migration**: 530
**Started**: 2025-12-09

---

## Overview

Predictive governance forecasting for Unite-Hub founder intelligence. Uses heuristics, linear regression, time-series analysis, and ML models to forecast compliance scores, risk scores, incident rates, debt accumulation, and system load.

---

## Components

### Database Schema (Migration 530)

**Tables**:
- `governance_forecast` — Predictive forecast records with confidence intervals
- `forecast_models` — ML model metadata and performance tracking

**ENUMs**:
- `forecast_type` — compliance_score, risk_score, incident_rate, debt_accumulation, remediation_backlog, system_load, user_satisfaction, other
- `forecast_horizon` — 1_day, 7_days, 30_days, 90_days, 1_year
- `forecast_method` — heuristic, linear_regression, time_series, ml_model, manual

**Functions**:
- `record_forecast()` — Records new forecast with confidence intervals
- `list_forecasts()` — Query forecasts with expiration filter
- `get_latest_forecasts()` — Get most recent forecast by type
- `get_forecast_accuracy()` — Calculate accuracy metrics for expired forecasts

**RLS Policies**: Full tenant isolation on all tables

---

### Service Layer

**File**: `src/lib/founder/governanceForecastService.ts`

**Exports**:
- `listForecasts(tenantId, includeExpired?)` — Query forecasts with expiration filter
- `getLatestForecasts(tenantId, forecastType?)` — Get most recent forecast by type
- `recordForecast(args)` — Create new forecast with confidence intervals
- `getForecastAccuracy(tenantId)` — Calculate accuracy metrics

**Types**:
- `ForecastType` — Forecast classification enum
- `ForecastHorizon` — Time horizon enum
- `ForecastMethod` — Method used enum

---

### API Routes

**Endpoint**: `/api/founder/forecast`

**GET**:
- `?workspaceId=X` — Required tenant ID
- `?action=accuracy` — Get forecast accuracy metrics
- `?action=latest&forecastType=X` — Get latest forecast by type
- `?includeExpired=true` — Include expired forecasts in list

**POST**:
- Body: `{ forecastType, forecastHorizon, forecastMethod, forecastValue, confidence?, lowerBound?, upperBound?, metadata? }`
- Returns: `{ forecastId }`

---

### UI Page

**Route**: `/founder/forecast`

**Features**:
- Accuracy cards (total forecasts, expired forecasts, avg confidence, avg error)
- Filters (forecast type, view mode: active/all)
- Forecasts list with method badges
- Confidence intervals and error metrics display
- Trend indicators (up/down arrows) when actual value available
- Expiration status badges
- Design system compliant with forecast-specific styling

---

## Usage Example

```typescript
import { recordForecast, getLatestForecasts } from "@/src/lib/founder/governanceForecastService";

// Record compliance score forecast
await recordForecast({
  tenantId: "uuid",
  forecastType: "compliance_score",
  forecastHorizon: "30_days",
  forecastMethod: "time_series",
  forecastValue: 87.5,
  confidence: 85.0, // 85% confidence
  lowerBound: 82.0,
  upperBound: 93.0,
  metadata: { model_version: "v2.1", training_samples: 1000 },
});

// Get latest compliance forecast
const forecasts = await getLatestForecasts("uuid", "compliance_score");
console.log(forecasts[0].forecast_value); // 87.5
```

---

## Forecast Types

1. **Compliance Score**: Predicted regulatory compliance level (0-100)
2. **Risk Score**: Aggregate security and operational risk (0-100)
3. **Incident Rate**: Expected incidents per day/week/month
4. **Debt Accumulation**: Technical debt growth rate
5. **Remediation Backlog**: Open issues/tickets forecast
6. **System Load**: CPU, memory, request load predictions
7. **User Satisfaction**: NPS, CSAT, retention predictions

---

## Forecast Methods

1. **Heuristic**: Rule-based forecasting (fast, low accuracy)
2. **Linear Regression**: Simple trend extrapolation
3. **Time Series**: ARIMA, Prophet for seasonal patterns
4. **ML Model**: Neural networks, gradient boosting for complex patterns
5. **Manual**: Human analyst predictions

---

## Confidence Intervals

Forecasts include optional confidence intervals:
- `confidence`: Probability forecast is accurate (0-100%)
- `lowerBound`: Lower bound of prediction range
- `upperBound`: Upper bound of prediction range

Example: Forecast 87.5 ± 5.5 with 85% confidence means 85% chance actual value is between 82.0 and 93.0.

---

## Accuracy Tracking

When forecast horizon expires, system can record actual_value to calculate forecast_error:
- `forecast_error = actual_value - forecast_value`
- `get_forecast_accuracy()` returns avg absolute error across all expired forecasts

This feedback loop improves model selection and hyperparameter tuning.

---

## Integration Points

- **Governance Engine**: Use forecasts to proactively allocate resources
- **Capacity Planning**: Forecast system load for auto-scaling decisions
- **Budget Allocation**: Forecast incident rates to plan support capacity
- **Compliance Dashboard**: Show projected compliance scores for stakeholders
- **ML Pipeline**: Train and evaluate forecast models with historical data
- **Alert System**: Trigger alerts when forecast predicts threshold breaches

---

## Next Steps

1. Build ML model training pipeline for each forecast type
2. Integrate historical data for time-series forecasting
3. Add forecast accuracy feedback loop (record actual values)
4. Create forecast comparison UI (compare method performance)
5. Build forecast-driven auto-scaling for system load predictions
6. Add forecast explainability (feature importance, confidence drivers)
7. Implement ensemble forecasting (combine multiple methods)

---

## Migration Notes

- Idempotent: DROP IF EXISTS for clean re-runs
- RLS: All tables have tenant_id with FOR ALL policies
- Automatic expiration: valid_until timestamp calculated from forecast_horizon
- Accuracy tracking: actual_value and forecast_error populated post-expiration
- Model versioning: forecast_models table tracks model metadata
- Functions: SECURITY DEFINER for cross-tenant aggregation
- No breaking changes: Purely additive schema

---

## Forecast Horizons

- **1_day**: Short-term predictions (incident rates, system load)
- **7_days**: Weekly forecasts (compliance scores, user satisfaction)
- **30_days**: Monthly forecasts (debt accumulation, remediation backlog)
- **90_days**: Quarterly forecasts (risk scores, capacity planning)
- **1_year**: Long-term forecasts (strategic planning, budget allocation)

---

**Related Phases**:
- E38: Founder Observatory
- E39: Drift Detector
- E40: Early Warning System
