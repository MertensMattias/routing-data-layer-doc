-- =====================================================================
-- Seed: Dictionary - Environments
-- File: 001_seed_dictionaries_environments.sql
-- Purpose: Seed cfg_Dic_Environment table with environment definitions
-- Dependencies: None (prerequisite for all other seeds)
-- Records: 3 environments (dvp, acc, prd)
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Seed environments
    MERGE [ivr].[cfg_Dic_Environment] AS target
    USING (
        SELECT 'dvp' AS Environment, 'Development' AS DisplayName, 'Development environment for testing and development' AS Description, 'http://localhost:3001' AS UrlBase, '{"debug": true}' AS Config
        UNION ALL
        SELECT 'acc', 'Acceptance', 'Acceptance environment for user acceptance testing', 'https://acc-api.example.com', '{"debug": false}'
        UNION ALL
        SELECT 'prd', 'Production', 'Production environment for live operations', 'https://api.example.com', '{"debug": false}'
    ) AS source (Environment, DisplayName, Description, UrlBase, Config)
    ON target.Environment = source.Environment
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            Description = source.Description,
            UrlBase = source.UrlBase,
            Config = source.Config,
            DateUpdated = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (Environment, DisplayName, Description, UrlBase, Config, IsActive, DateCreated, DateUpdated)
        VALUES (source.Environment, source.DisplayName, source.Description, source.UrlBase, source.Config, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Environments seeded successfully (3 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
