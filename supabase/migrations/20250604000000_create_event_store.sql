-- Create event store table
CREATE TABLE event_store (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);

-- Create index for efficient aggregate querying
CREATE INDEX idx_event_store_aggregate ON event_store (aggregate_id);

COMMENT ON TABLE event_store IS 'Stores all domain events for event sourcing';
