-- =====================================================================
-- Migration: Add Name-Based Transition Resolution
-- Purpose: Enable version-agnostic segment references
-- Date: 2026-01-13
-- Note: Backfill skipped for fresh database (see verify.sql for prod use)
-- =====================================================================

-- Step 1: Add new columns
ALTER TABLE seg_SegmentTransition
  ADD SourceSegmentName VARCHAR(100) NULL;

ALTER TABLE seg_SegmentTransition
  ADD NextSegmentName VARCHAR(100) NULL;

-- Step 2: Add indexes for name-based queries
CREATE INDEX ix_transition_source_name
  ON seg_SegmentTransition(RoutingId, ChangeSetId, SourceSegmentName);

CREATE INDEX ix_transition_target_name
  ON seg_SegmentTransition(RoutingId, ChangeSetId, NextSegmentName);

-- Migration completed successfully!
