-- Add order columns to preserve display order for segments, configs, and transitions
-- This migration enables order preservation through JSON import/export
-- Note: SegmentOrder already exists in seg_Segment, so we only add ConfigOrder and TransitionOrder
-- Note: Backfill skipped for fresh database setup (see migration_part2.sql for production use)

-- Add ConfigOrder column to seg_Key (config table)
ALTER TABLE seg_Key ADD ConfigOrder INT NULL;

-- Add TransitionOrder column to seg_SegmentTransition
ALTER TABLE seg_SegmentTransition ADD TransitionOrder INT NULL;

-- Create indexes for efficient ordered retrieval
-- Note: ix_segment_order already exists for seg_Segment
CREATE NONCLUSTERED INDEX ix_key_order
  ON seg_Key(SegmentId, ConfigOrder);

CREATE NONCLUSTERED INDEX ix_transition_order
  ON seg_SegmentTransition(SegmentId, TransitionOrder);
