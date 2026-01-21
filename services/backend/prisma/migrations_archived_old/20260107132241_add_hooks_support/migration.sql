BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[seg_Dic_SegmentType] ADD [Hooks] NVARCHAR(max),
[HooksSchema] NVARCHAR(max);

-- AlterTable
ALTER TABLE [dbo].[seg_Segment] ADD [Hooks] NVARCHAR(max);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
