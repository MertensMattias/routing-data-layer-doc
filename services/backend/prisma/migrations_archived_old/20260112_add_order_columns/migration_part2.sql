-- Part 2: Backfill existing data with order

-- Backfill existing config items with order (alphabetical by KeyName)
WITH OrderedConfigs AS (
  SELECT
    k.DicSegmentTypeId,
    k.DicKeyId,
    k.SegmentId,
    ROW_NUMBER() OVER (
      PARTITION BY k.SegmentId
      ORDER BY dk.KeyName
    ) - 1 AS NewOrder
  FROM seg_Key k
  INNER JOIN seg_Dic_Key dk ON k.DicKeyId = dk.DicKeyId
)
UPDATE k
SET ConfigOrder = oc.NewOrder
FROM seg_Key k
INNER JOIN OrderedConfigs oc
  ON k.DicSegmentTypeId = oc.DicSegmentTypeId
  AND k.DicKeyId = oc.DicKeyId
  AND k.SegmentId = oc.SegmentId;

-- Backfill existing transitions with order (alphabetical by ResultName)
WITH OrderedTransitions AS (
  SELECT
    SegmentTransitionId,
    ROW_NUMBER() OVER (
      PARTITION BY SegmentId
      ORDER BY ResultName
    ) - 1 AS NewOrder
  FROM seg_SegmentTransition
)
UPDATE st
SET TransitionOrder = ot.NewOrder
FROM seg_SegmentTransition st
INNER JOIN OrderedTransitions ot ON st.SegmentTransitionId = ot.SegmentTransitionId;
