-- =====================================================================
-- Seed: Dictionary - Languages
-- File: 002_seed_dictionaries_languages.sql
-- Purpose: Seed cfg_Dic_Language table with BCP47 language codes
-- Dependencies: None
-- Records: 3 languages (nl-BE, fr-BE, en-US)
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Seed languages
    MERGE [ivr].[cfg_Dic_Language] AS target
    USING (
        SELECT 'nl-BE' AS LanguageCode, 'Dutch (Belgium)' AS DisplayName, 'Nederlands (België)' AS NativeName, 1 AS SortOrder
        UNION ALL
        SELECT 'fr-BE', 'French (Belgium)', 'Français (Belgique)', 2
        UNION ALL
        SELECT 'de-BE', 'German (Belgium)', 'Deutsch (Belgien)', 3
        UNION ALL
        SELECT 'en-GB', 'English (United Kingdom)', 'English (United Kingdom)', 4
    ) AS source (LanguageCode, DisplayName, NativeName, SortOrder)
    ON target.LanguageCode = source.LanguageCode
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            NativeName = source.NativeName,
            SortOrder = source.SortOrder,
            DateUpdated = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (LanguageCode, DisplayName, NativeName, SortOrder, IsActive, DateCreated, DateUpdated)
        VALUES (source.LanguageCode, source.DisplayName, source.NativeName, source.SortOrder, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Languages seeded successfully (4 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
