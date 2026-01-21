-- Phase 2.5: Update SegmentTransition unique constraint to support multiple rows per ResultName
-- This allows context-aware routing where multiple rows can have the same SegmentId+ResultName
-- but different ContextKey values

-- Drop old unique constraint
ALTER TABLE [dbo].[seg_SegmentTransition]
DROP CONSTRAINT [seg_SegmentTransition_SegmentId_ResultName_key];

-- Add new unique constraint including ContextKey
-- This allows: SegmentId=guid, ResultName=PREMIUM, ContextKey=RESI_STANDARD
--         and: SegmentId=guid, ResultName=PREMIUM, ContextKey=PROF_STANDARD
--         and: SegmentId=guid, ResultName=PREMIUM, ContextKey=default
-- But prevents duplicates like two rows with same SegmentId+ResultName+ContextKey
ALTER TABLE [dbo].[seg_SegmentTransition]
ADD CONSTRAINT [seg_SegmentTransition_SegmentId_ResultName_ContextKey_key]
UNIQUE NONCLUSTERED ([SegmentId], [ResultName], [ContextKey]);
