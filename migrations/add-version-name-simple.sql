-- Add VersionName column if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('ivr.rt_ChangeSet')
    AND name = 'VersionName'
)
BEGIN
    ALTER TABLE ivr.rt_ChangeSet ADD VersionName NVARCHAR(128) NULL;
    PRINT 'VersionName column added successfully';
END
ELSE
BEGIN
    PRINT 'VersionName column already exists';
END
