-- =====================================================================
-- Seed: Dictionary - Key Types
-- File: 005_seed_dictionaries_key_types.sql
-- Purpose: Seed seg_Dic_KeyType table with data type definitions
-- Dependencies: None
-- Records: 5 key types (string, int, bool, decimal, json)
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Seed key types
    MERGE [ivr].[seg_Dic_KeyType] AS target
    USING (
        SELECT 'string' AS TypeName, 'String' AS DisplayName, 'Text string value' AS Description
        UNION ALL
        SELECT 'int', 'Integer', 'Whole number value'
        UNION ALL
        SELECT 'bool', 'Boolean', 'True/false value'
        UNION ALL
        SELECT 'decimal', 'Decimal', 'Decimal number value'
        UNION ALL
        SELECT 'json', 'JSON', 'JSON object or array value'
    ) AS source (TypeName, DisplayName, Description)
    ON target.TypeName = source.TypeName
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            Description = source.Description
    WHEN NOT MATCHED THEN
        INSERT (TypeName, DisplayName, Description)
        VALUES (source.TypeName, source.DisplayName, source.Description);

    COMMIT TRAN;

    PRINT '✅ Key types seeded successfully (5 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
