# ACC Migration - Complete Seed Execution Guide

## 📦 Files Created

### 1. **007_seed_acc_segments.sql** (818 lines)

Creates all segment definitions:
- Base routing segments (GET_LANGUAGE, CHECK_SCHEDULER, IDENTIFICATION, etc.)
- Intent detection segments (GET_INTENT, NEW_INTENT, OTHER_INTENT)
- Transfer/destination segments (RESI_BILLING, PROF_BILLING, RETENTION_*, BO_RECOVERY_LR, etc.)
- Knowledge base message segments (INTENT_MSG_001 through INTENT_MSG_019)
- Self-service segments (SSVIM, SSVAA, SSVNBD, SSVMD, SSVSST, etc.)

**Total Segments Created**: ~80 segments (for both ENERGYLINE and PROF)

### 2. **008_seed_acc_intent_transitions.sql** (516 lines)

Creates all intent-to-segment transitions:
- 8 customer type/status combinations
- 45 intents per combination
- 3 intent detection segments (GET_INTENT, NEW_INTENT, OTHER_INTENT) × each intent

**Total Transitions Created**: 1,080 transitions (8 × 45 × 3)

## 🚀 Execution Order

### Prerequisites

Before running these seeds, ensure:

1. **Database exists**: `RoutingDataLayer_ACC`
2. **Schema structure created**: Run Prisma migrations or SQL schema scripts
3. **Segment types exist** in `seg.Dic_SegmentType`:
   ```sql
   SELECT SegmentTypeName FROM seg.Dic_SegmentType;
   ```
   Expected: `routing`, `scheduler`, `intent_detection`, `event`, `kb_message`, `self_service`, `transfer`, `disconnect`

4. **Config keys exist** in `seg.Dic_Key` for self-service segments:
   ```sql
   SELECT k.KeyName, st.SegmentTypeName 
   FROM seg.Dic_Key k
   JOIN seg.Dic_SegmentType st ON k.SegmentTypeId = st.SegmentTypeId
   WHERE st.SegmentTypeName = 'self_service';
   ```
   Expected: `useOnlyOnce`, `checkEligibility`, `cdbDicId`, `cdbTimeout`

5. **Company projects exist** in `cfg.Dic_CompanyProject`:
   ```sql
   SELECT * FROM cfg.Dic_CompanyProject 
   WHERE CustomerId = 'ENGIE' AND ProjectId IN ('ENERGYLINE', 'PROF');
   ```

### Step 1: Run Segment Seed

```bash
sqlcmd -i seeds/007_seed_acc_segments.sql -S [server] -d RoutingDataLayer_ACC -U [user]
```

**Expected Output**:
```
✅ ACC Segments seeded successfully
   - Base routing segments created
   - Intent detection segments created
   - Transfer/destination segments created
   - Knowledge base message segments created
   - Self-service segments created

⚠️  NEXT STEP: Run 008_seed_acc_intent_transitions.sql to populate intent mappings
```

### Step 2: Run Intent Transitions Seed

```bash
sqlcmd -i seeds/008_seed_acc_intent_transitions.sql -S [server] -d RoutingDataLayer_ACC -U [user]
```

**Expected Output**:
```
✅ ACC Intent Transitions seeded successfully
   - RESI + NOT_IDENTIFIED: 45 intents × 3 segments = 135 transitions
   - PROF + NOT_IDENTIFIED: 45 intents × 3 segments = 135 transitions
   - RESI + STANDARD: 45 intents × 3 segments = 135 transitions
   - PROF + STANDARD: 45 intents × 3 segments = 135 transitions
   - RESI + RETENTION: 45 intents × 3 segments = 135 transitions
   - PROF + RETENTION: 45 intents × 3 segments = 135 transitions
   - RESI + LEGAL_RECOVERY: 45 intents × 3 segments = 135 transitions
   - PROF + LEGAL_RECOVERY: 45 intents × 3 segments = 135 transitions
   - TOTAL: 1,080 transitions (8 combinations × 135)

✅ ACC Migration Complete!
```

## ✅ Validation

### 1. Verify Segment Count

```sql
SELECT 
  s.RoutingId,
  st.SegmentTypeName,
  COUNT(*) AS SegmentCount
FROM seg.Segment s
JOIN seg.Dic_SegmentType st ON s.SegmentTypeId = st.SegmentTypeId
WHERE s.RoutingId IN ('ENGIE-ENERGYLINE', 'ENGIE-PROF')
  AND s.IsActive = 1
GROUP BY s.RoutingId, st.SegmentTypeName
ORDER BY s.RoutingId, st.SegmentTypeName;
```

**Expected Results** (approximate):
| RoutingId | SegmentTypeName | SegmentCount |
|-----------|----------------|--------------|
| ENGIE-ENERGYLINE | routing | 4 |
| ENGIE-ENERGYLINE | scheduler | 1 |
| ENGIE-ENERGYLINE | intent_detection | 3 |
| ENGIE-ENERGYLINE | event | 2 |
| ENGIE-ENERGYLINE | kb_message | 19 |
| ENGIE-ENERGYLINE | self_service | 15 |
| ENGIE-ENERGYLINE | transfer | 11 |
| ENGIE-ENERGYLINE | disconnect | 1 |
| ENGIE-PROF | routing | 2 |
| ENGIE-PROF | scheduler | 1 |
| ENGIE-PROF | intent_detection | 3 |
| ENGIE-PROF | event | 2 |
| ENGIE-PROF | kb_message | 19 |
| ENGIE-PROF | transfer | 4 |
| ENGIE-PROF | disconnect | 1 |

### 2. Verify Intent Transitions

```sql
-- Count transitions per intent detection segment
SELECT 
  s.RoutingId,
  s.SegmentName,
  COUNT(*) AS TransitionCount
FROM seg.SegmentTransition st
JOIN seg.Segment s ON st.SegmentId = s.SegmentId
WHERE s.SegmentName IN ('GET_INTENT', 'NEW_INTENT', 'OTHER_INTENT')
  AND s.RoutingId IN ('ENGIE-ENERGYLINE', 'ENGIE-PROF')
GROUP BY s.RoutingId, s.SegmentName
ORDER BY s.RoutingId, s.SegmentName;
```

**Expected Results**:
| RoutingId | SegmentName | TransitionCount |
|-----------|-------------|-----------------|
| ENGIE-ENERGYLINE | GET_INTENT | 180 (4 combos × 45) |
| ENGIE-ENERGYLINE | NEW_INTENT | 180 |
| ENGIE-ENERGYLINE | OTHER_INTENT | 180 |
| ENGIE-PROF | GET_INTENT | 180 |
| ENGIE-PROF | NEW_INTENT | 180 |
| ENGIE-PROF | OTHER_INTENT | 180 |

### 3. Verify Self-Service Configs

```sql
-- Check self-service segment configurations
SELECT 
  s.SegmentName,
  k.KeyName,
  sc.Value
FROM seg.SegmentConfig sc
JOIN seg.Segment s ON sc.SegmentId = s.SegmentId
JOIN seg.Dic_Key k ON sc.KeyId = k.KeyId
WHERE s.SegmentName LIKE 'SSV%'
  AND s.RoutingId = 'ENGIE-ENERGYLINE'
ORDER BY s.SegmentName, k.KeyName;
```

**Expected**: Each SSV* segment should have 2-4 config entries (useOnlyOnce, checkEligibility, cdbDicId, cdbTimeout)

### 4. Verify Transition Chains

```sql
-- Test a complete intent flow: GET_LANGUAGE → CHECK_SCHEDULER → IDENTIFICATION → GET_INTENT → RESI_BILLING
WITH RECURSIVE SegmentChain AS (
  -- Start with GET_LANGUAGE
  SELECT 
    s.SegmentId,
    s.SegmentName,
    CAST(s.SegmentName AS NVARCHAR(MAX)) AS Path,
    0 AS Depth
  FROM seg.Segment s
  WHERE s.SegmentName = 'GET_LANGUAGE' AND s.RoutingId = 'ENGIE-ENERGYLINE'
  
  UNION ALL
  
  -- Follow transitions
  SELECT 
    ns.SegmentId,
    ns.SegmentName,
    CAST(sc.Path + ' → ' + ns.SegmentName AS NVARCHAR(MAX)),
    sc.Depth + 1
  FROM SegmentChain sc
  JOIN seg.SegmentTransition st ON sc.SegmentId = st.SegmentId
  JOIN seg.Segment ns ON st.NextSegmentId = ns.SegmentId
  WHERE sc.Depth < 5  -- Limit depth to prevent infinite loops
)
SELECT Path, Depth
FROM SegmentChain
WHERE Depth <= 5
ORDER BY Depth, Path;
```

## 🔧 Troubleshooting

### Error: "Invalid object name 'seg.Dic_SegmentType'"

**Solution**: Run Prisma migrations or SQL schema creation scripts first.

### Error: "The INSERT statement conflicted with the FOREIGN KEY constraint"

**Solution**: Ensure prerequisite data exists (segment types, config keys, company projects).

### Error: "Cannot insert duplicate key row"

**Solution**: Seeds may have already been run. Check existing data:
```sql
SELECT COUNT(*) FROM seg.Segment WHERE RoutingId IN ('ENGIE-ENERGYLINE', 'ENGIE-PROF');
```

If data exists, either:
1. Delete and re-run: 
   ```sql
   DELETE FROM seg.SegmentTransition WHERE SegmentId IN (
     SELECT SegmentId FROM seg.Segment WHERE RoutingId IN ('ENGIE-ENERGYLINE', 'ENGIE-PROF')
   );
   DELETE FROM seg.SegmentConfig WHERE SegmentId IN (
     SELECT SegmentId FROM seg.Segment WHERE RoutingId IN ('ENGIE-ENERGYLINE', 'ENGIE-PROF')
   );
   DELETE FROM seg.Segment WHERE RoutingId IN ('ENGIE-ENERGYLINE', 'ENGIE-PROF');
   ```
2. Or skip re-running the seed

### Warning: Some transitions have NULL NextSegmentId

This is expected for:
- KB message transitions where NOT_RELATED varies by message type
- These will need to be manually populated based on specific message logic

## 📊 Migration Summary

### From Old System

- **File**: `TO_MIGRATE__obalLines.js` (lines 172-191)
- **File**: `TO_MIRGRATE_segmentSconfig.js` (lines 15-376)
- **Structure**: JavaScript Map with merged config + CSV string with intent mappings

### To New System

- **Database**: SQL Server with normalized schema
- **Tables**: `seg.Segment`, `seg.SegmentTransition`, `seg.SegmentConfig`
- **Structure**: Relational data model with segments, transitions, and configs

### Key Transformations

#### 1. Segment Configuration

**Old**: JavaScript function definitions in `cdb` object
```javascript
cdbPlaceHolders: function (v) {
  return [
    { placeHolder: 'gpCustomerCA', valueToReplace: 'varObj.customer.customerCA' }
  ];
}
```

**New**: JSON string in `SegmentConfig.Value`
```sql
KeyName: 'cdbDicId', Value: '8300'
KeyName: 'useOnlyOnce', Value: 'true'
```

#### 2. Intent Mapping

**Old**: CSV string parsed at runtime
```csv
;adjust_advance;RESI;NOT_IDENTIFIED;RESI_BILLING;RESI_BILLING;RESI_BILLING;RESI_BILLING
```

**New**: Individual `SegmentTransition` records
```sql
ResultName: 'adjust_advance_RESI_NOT_IDENTIFIED'
NextSegmentId: (SegmentId of RESI_BILLING)
```

#### 3. Customer Type/Status Handling

**Old**: Single segment name used across all languages, CSV columns for language-specific routing
**New**: Result name encodes customer type + status, allowing dynamic routing based on session context

## 🎯 Next Steps

1. ✅ Run segment seeds (007)
2. ✅ Run intent transition seeds (008)
3. ⏳ Create routing table entries (see `ACC_MIGRATION_SEED_DATA.md`)
4. ⏳ Populate message store with content
5. ⏳ Test end-to-end call flow
6. ⏳ Migrate PRD and DVP environments

## 📚 Related Documentation

- **Full Analysis**: `ACC_MIGRATION_SEED_DATA.md`
- **Quick Reference**: `ACC_MIGRATION_SUMMARY.md`
- **Schema Docs**: `services/backend/prisma/SCHEMA_SUMMARY.md`
- **Migration Guide**: `services/backend/prisma/MIGRATION_GUIDE.md`
