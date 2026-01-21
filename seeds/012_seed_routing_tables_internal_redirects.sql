-- =====================================================================
-- Seed: Routing Tables - Internal Redirects (Extension Segments)
-- File: 012_seed_routing_tables_internal_redirects.sql
-- Purpose: Seed rt_RoutingTable table with internal redirect entries for segments pointing to extensions
-- Dependencies: 003_seed_dictionaries_company_projects.sql, 034_seed_segments_engie_energyline.sql
-- Records: ~20 internal redirect entries
-- Re-run safe: Yes (uses MERGE)
-- Source: import_segmentDic.js - segments with remoteAddress in params
-- Note: These routing entries redirect internally to TRANSFER segment with extension configuration
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables
    DECLARE @CompanyProjectEngieEnergyline INT;

    -- Get company project ID
    SELECT @CompanyProjectEngieEnergyline = CompanyProjectId FROM [ivr].[cfg_Dic_CompanyProject] WHERE CustomerId = 'ENGIE' AND ProjectId = 'ENERGYLINE';

    -- Seed internal redirect routing tables
    -- These are segments that point to extensions (remoteAddress in params)
    -- They become routing entries with sourceId=segmentName, initSegment=TRANSFER
    MERGE [ivr].[rt_RoutingTable] AS target
    USING (
        -- RESI extension segments
        SELECT NEWID() AS RoutingTableId, 'RESI_SHORT_1_BILLING' AS SourceId, 'RESI_SHORT_1_BILLING' AS RoutingId, @CompanyProjectEngieEnergyline AS DicCompanyProjectId, NULL AS LanguageCode, NULL AS MessageStoreId, NULL AS SchedulerId, 'TRANSFER' AS InitSegment, '{}' AS FeatureFlags, '{"extensionType":"internal_redirect","defaultExtension":"554190","extensions":{"nl-BE":"554190","fr-BE":"554101"}}' AS Config
        UNION ALL SELECT NEWID(), 'RESI_SHORT_2_BILLING', 'RESI_SHORT_2_BILLING', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554192","extensions":{"nl-BE":"554192","fr-BE":"554193"}}'
        UNION ALL SELECT NEWID(), 'RESI_BILLING', 'RESI_BILLING', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554100","extensions":{"nl-BE":"554100","fr-BE":"554101","de-BE":"554102","en-GB":"554103"}}'
        UNION ALL SELECT NEWID(), 'RESI_MOVE', 'RESI_MOVE', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554120","extensions":{"nl-BE":"554120","fr-BE":"554121","de-BE":"554122","en-GB":"554123"}}'
        UNION ALL SELECT NEWID(), 'RESI_SALES', 'RESI_SALES', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554140","extensions":{"nl-BE":"554140","fr-BE":"554141","de-BE":"554142","en-GB":"554143"}}'
        UNION ALL SELECT NEWID(), 'RESI_HOME', 'RESI_HOME', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554160","extensions":{"nl-BE":"554160","fr-BE":"554161","de-BE":"554162","en-GB":"554163"}}'
        UNION ALL SELECT NEWID(), 'RESI_OTHER', 'RESI_OTHER', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554180","extensions":{"nl-BE":"554180","fr-BE":"554181","de-BE":"554182","en-GB":"554183"}}'
        -- PROF extension segments
        UNION ALL SELECT NEWID(), 'PROF_BILLING', 'PROF_BILLING', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554200","extensions":{"nl-BE":"554200","fr-BE":"554210","de-BE":"554220","en-GB":"554230"}}'
        UNION ALL SELECT NEWID(), 'PROF_PROF', 'PROF_PROF', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554202","extensions":{"nl-BE":"554202","fr-BE":"554212","de-BE":"554222","en-GB":"554232"}}'
        UNION ALL SELECT NEWID(), 'PROF_HOME', 'PROF_HOME', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554201","extensions":{"nl-BE":"554201","fr-BE":"554211","de-BE":"554221","en-GB":"554231"}}'
        -- RETENTION extension segments
        UNION ALL SELECT NEWID(), 'RETENTION_BILLING', 'RETENTION_BILLING', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554250","extensions":{"nl-BE":"554250","fr-BE":"554260"}}'
        UNION ALL SELECT NEWID(), 'RETENTION_HOME', 'RETENTION_HOME', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554251","extensions":{"nl-BE":"554251","fr-BE":"554261"}}'
        UNION ALL SELECT NEWID(), 'RETENTION_MOVE', 'RETENTION_MOVE', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554252","extensions":{"nl-BE":"554252","fr-BE":"554262"}}'
        UNION ALL SELECT NEWID(), 'RETENTION_OTHER', 'RETENTION_OTHER', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554253","extensions":{"nl-BE":"554253","fr-BE":"554263"}}'
        UNION ALL SELECT NEWID(), 'RETENTION_SALES', 'RETENTION_SALES', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554254","extensions":{"nl-BE":"554254","fr-BE":"554264"}}'
        -- Back office extension segments
        UNION ALL SELECT NEWID(), 'BO_OVF_DUNNING', 'BO_OVF_DUNNING', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554310","extensions":{"nl-BE":"554310","fr-BE":"554311"}}'
        UNION ALL SELECT NEWID(), 'BO_RECOVERY_LR', 'BO_RECOVERY_LR', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"554300","extensions":{"nl-BE":"554300","fr-BE":"554303"}}'
        -- Enterprise and redirect segments
        UNION ALL SELECT NEWID(), 'ENTERPRISE', 'ENTERPRISE', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"+3223367920","extensions":{"nl-BE":"+3223367920","fr-BE":"+3223367920"}}'
        UNION ALL SELECT NEWID(), 'REDIRECT_ENERGYLINE', 'REDIRECT_ENERGYLINE', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"+3271698011","extensions":{"de-BE":"+3271698011","en-GB":"+3281809511"}}'
        UNION ALL SELECT NEWID(), 'REDIRECT_PROF', 'REDIRECT_PROF', @CompanyProjectEngieEnergyline, NULL, NULL, NULL, 'TRANSFER', '{}', '{"extensionType":"internal_redirect","defaultExtension":"+3281809513","extensions":{"de-BE":"+3281809513","en-GB":"+3271698013"}}'
    ) AS source (RoutingTableId, SourceId, RoutingId, DicCompanyProjectId, LanguageCode, MessageStoreId, SchedulerId, InitSegment, FeatureFlags, Config)
    ON target.SourceId = source.SourceId
    WHEN MATCHED THEN
        UPDATE SET
            RoutingId = source.RoutingId,
            DicCompanyProjectId = source.DicCompanyProjectId,
            LanguageCode = source.LanguageCode,
            MessageStoreId = source.MessageStoreId,
            SchedulerId = source.SchedulerId,
            InitSegment = source.InitSegment,
            FeatureFlags = source.FeatureFlags,
            Config = source.Config,
            DateUpdated = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (RoutingTableId, SourceId, RoutingId, DicCompanyProjectId, LanguageCode, MessageStoreId, SchedulerId, InitSegment, FeatureFlags, Config, IsActive, DateCreated, DateUpdated)
        VALUES (source.RoutingTableId, source.SourceId, source.RoutingId, source.DicCompanyProjectId, source.LanguageCode, source.MessageStoreId, source.SchedulerId, source.InitSegment, source.FeatureFlags, source.Config, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Internal redirect routing tables seeded successfully (~20 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
