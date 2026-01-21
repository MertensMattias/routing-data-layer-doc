-- Part 1: Add columns and indexes only
-- Add order columns to preserve display order for segments, configs, and transitions

-- Add ConfigOrder column to seg_Key (config table)
ALTER TABLE seg_Key ADD ConfigOrder INT NULL;

-- Add TransitionOrder column to seg_SegmentTransition
ALTER TABLE seg_SegmentTransition ADD TransitionOrder INT NULL;

-- Create indexes for efficient ordered retrieval
CREATE NONCLUSTERED INDEX ix_key_order
  ON seg_Key(SegmentId, ConfigOrder);

CREATE NONCLUSTERED INDEX ix_transition_order
  ON seg_SegmentTransition(SegmentId, TransitionOrder);
