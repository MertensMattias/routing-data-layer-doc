/*
  Warnings:

  - You are about to drop the `rt_Flow` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[rt_Flow] DROP CONSTRAINT [rt_Flow_CompanyProjectId_fkey];

-- DropTable
DROP TABLE [dbo].[rt_Flow];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
