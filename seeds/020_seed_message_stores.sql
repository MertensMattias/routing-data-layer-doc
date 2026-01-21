-- =====================================================================
-- Seed: Message Stores
-- File: 020_seed_message_stores.sql
-- Purpose: Seed msg_MessageStore table with message store containers
-- Dependencies: 003_seed_dictionaries_company_projects.sql, 002_seed_dictionaries_languages.sql
-- Records: 3 message stores (one per company/project)
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables for company project IDs
    DECLARE @CompanyProjectEngieEnergyline INT;

    -- Get company project IDs
    SELECT @CompanyProjectEngieEnergyline = CompanyProjectId FROM [ivr].[cfg_Dic_CompanyProject] WHERE CustomerId = 'ENGIE' AND ProjectId = 'ENERGYLINE';

    -- Validate that company project was found
    IF @CompanyProjectEngieEnergyline IS NULL
    BEGIN
        RAISERROR('Company project ENGIE/ENERGYLINE not found. Please run 003_seed_dictionaries_company_projects.sql first.', 16, 1);
        RETURN;
    END

    -- Seed message stores
    MERGE [ivr].[msg_MessageStore] AS target
    USING (
        SELECT
            @CompanyProjectEngieEnergyline AS DicCompanyProjectId,
            'ENGIE Energyline Messages' AS Name,
            'Message store for ENGIE Energyline project' AS Description,
            '["nl-BE", "fr-BE", "de-BE", "en-GB"]' AS AllowedLanguages,
            'nl-BE' AS DefaultLanguage
    ) AS source (DicCompanyProjectId, Name, Description, AllowedLanguages, DefaultLanguage)
    ON target.DicCompanyProjectId = source.DicCompanyProjectId AND target.Name = source.Name
    WHEN MATCHED THEN
        UPDATE SET
            Description = source.Description,
            AllowedLanguages = source.AllowedLanguages,
            DefaultLanguage = source.DefaultLanguage,
            DateUpdated = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (DicCompanyProjectId, Name, Description, AllowedLanguages, DefaultLanguage, IsActive, DateCreated, DateUpdated)
        VALUES (source.DicCompanyProjectId, source.Name, source.Description, source.AllowedLanguages, source.DefaultLanguage, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Message stores seeded successfully (1 record)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
