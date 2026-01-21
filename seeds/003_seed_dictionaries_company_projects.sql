-- =====================================================================
-- Seed: Dictionary - Company Projects
-- File: 003_seed_dictionaries_company_projects.sql
-- Purpose: Seed cfg_Dic_CompanyProject table with customer/project combinations
-- Dependencies: None
-- Records: 3 company projects
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Seed company projects
    MERGE [ivr].[cfg_Dic_CompanyProject] AS target
    USING (
        SELECT 'ENGIE' AS CustomerId, 'ENERGYLINE' AS ProjectId, 'ENGIE-ENERGYLINE' AS DisplayName, 'RESI Customers' AS Description, 'okta-engie-energyline-flow' AS OktaGroup
        UNION ALL
        SELECT 'ENGIE', 'PROF', 'ENGIE-PROF', 'Professional Customers', 'okta-engie-prof-flow' AS OktaGroup
    ) AS source (CustomerId, ProjectId, DisplayName, Description, OktaGroup)
    ON target.CustomerId = source.CustomerId AND target.ProjectId = source.ProjectId
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            Description = source.Description,
            -- Only update OktaGroup if it doesn't violate unique constraint
            OktaGroup = CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM [ivr].[cfg_Dic_CompanyProject]
                    WHERE OktaGroup = source.OktaGroup
                    AND NOT (CustomerId = source.CustomerId AND ProjectId = source.ProjectId)
                ) THEN source.OktaGroup
                ELSE target.OktaGroup
            END,
            DateUpdated = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (CustomerId, ProjectId, DisplayName, Description, OktaGroup, IsActive, DateCreated, DateUpdated)
        VALUES (source.CustomerId, source.ProjectId, source.DisplayName, source.Description, source.OktaGroup, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Company projects seeded successfully (2 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
