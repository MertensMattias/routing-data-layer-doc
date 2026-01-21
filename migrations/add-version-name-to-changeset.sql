-- ChangeSet Refactoring: Add VersionName Column
-- This migration adds the versionName field to enable multiple named drafts
-- and better version history tracking.

-- Step 1: Add VersionName column
ALTER TABLE ivr.rt_ChangeSet
  ADD VersionName NVARCHAR(128) NULL;

-- Step 2: Add index for efficient version queries
CREATE INDEX ix_changeset_routing_status_active
  ON rt_ChangeSet(RoutingId, Status, IsActive)
  INCLUDE (VersionName, DateCreated);

-- Step 3: Backfill version names for existing changesets (optional)
-- This gives friendly names to existing drafts and published versions
UPDATE ivr.rt_ChangeSet
SET VersionName =
  CASE
    WHEN Status = 'published' THEN 'Published ' + FORMAT(DatePublished, 'yyyy-MM-dd')
    WHEN Status = 'draft' THEN 'Draft ' + FORMAT(DateCreated, 'yyyy-MM-dd')
    WHEN Status = 'archived' THEN 'Archived ' + FORMAT(DateCreated, 'yyyy-MM-dd')
    ELSE 'Version ' + FORMAT(DateCreated, 'yyyy-MM-dd')
  END
WHERE VersionName IS NULL;

-- Verify the changes
SELECT
  ChangeSetId,
  RoutingId,
  Status,
  VersionName,
  DateCreated,
  DatePublished
FROM ivr.rt_ChangeSet
ORDER BY RoutingId, DateCreated DESC;
