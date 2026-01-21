/**
 * Data Migration Script: Compute and persist segmentOrder for existing segments
 *
 * This script:
 * 1. Loads all routingIds from the database
 * 2. For each routingId, computes execution order via BFS from initSegment
 * 3. Updates segmentOrder column in database
 * 4. Handles both published (changeSetId = NULL) and draft segments
 *
 * Usage:
 *   cd services/backend
 *   npx ts-node src/scripts/migrate-segment-orders.ts [--dry-run] [--routingId=XXX]
 *
 * Options:
 *   --dry-run: Preview changes without updating database
 *   --routingId=XXX: Process only specific routingId
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SegmentInfo {
  segmentId: string;
  segmentName: string;
  changeSetId: string | null;
  outgoingTransitions: Array<{
    resultName: string;
    nextSegment: {
      segmentName: string;
    } | null;
  }>;
}

interface SegmentOrder {
  segmentId: string;
  segmentName: string;
  order: number;
}

/**
 * Compute execution order via BFS from initSegment
 */
function computeSegmentOrder(initSegment: string, segments: SegmentInfo[]): Map<string, number> {
  const orderMap = new Map<string, number>();
  const visited = new Set<string>();
  const queue = [initSegment];
  let orderIndex = 1;

  // Build segment map for quick lookup
  const segmentMap = new Map(segments.map((s) => [s.segmentName, s]));

  // BFS traversal
  while (queue.length > 0) {
    const segmentName = queue.shift()!;
    if (visited.has(segmentName)) continue;

    visited.add(segmentName);
    const segment = segmentMap.get(segmentName);
    if (!segment) continue;

    orderMap.set(segment.segmentId, orderIndex++);

    // Add transition targets to queue
    // Process "on" transitions (resultName != 'default')
    for (const transition of segment.outgoingTransitions) {
      if (transition.resultName !== 'default' && transition.nextSegment?.segmentName) {
        queue.push(transition.nextSegment.segmentName);
      }
    }

    // Process "default" transition
    const defaultTransition = segment.outgoingTransitions.find((t) => t.resultName === 'default');
    if (defaultTransition?.nextSegment?.segmentName) {
      queue.push(defaultTransition.nextSegment.segmentName);
    }
  }

  // Append unreachable segments at end (alphabetically)
  const unreached = segments
    .filter((s) => !visited.has(s.segmentName))
    .sort((a, b) => a.segmentName.localeCompare(b.segmentName));

  for (const segment of unreached) {
    orderMap.set(segment.segmentId, orderIndex++);
  }

  return orderMap;
}

/**
 * Process a single routingId
 */
async function processRoutingId(
  routingId: string,
  dryRun: boolean,
): Promise<{ processed: number; updated: number }> {
  console.log(`\nProcessing routingId: ${routingId}`);

  // Get routing entry to find initSegment
  const routing = await prisma.routingTable.findFirst({
    where: { routingId, isActive: true },
    select: { initSegment: true },
  });

  if (!routing) {
    console.log(`  ⚠️  Routing entry not found, skipping`);
    return { processed: 0, updated: 0 };
  }

  const initSegment = routing.initSegment;
  console.log(`  Init segment: ${initSegment}`);

  // Process both published (changeSetId = NULL) and draft segments
  const changeSets = await prisma.changeSet.findMany({
    where: { routingId, isActive: true },
    select: { changeSetId: true },
  });

  const changeSetIds = [null, ...changeSets.map((cs) => cs.changeSetId)];
  let totalProcessed = 0;
  let totalUpdated = 0;

  for (const changeSetId of changeSetIds) {
    const label = changeSetId ? `draft (${changeSetId})` : 'published';
    console.log(`  Processing ${label} segments...`);

    // Load all segments with transitions
    const segments = await prisma.segment.findMany({
      where: {
        routingId,
        changeSetId: changeSetId || null,
        isActive: true,
      },
      include: {
        outgoingTransitions: {
          include: {
            nextSegment: {
              select: { segmentName: true },
            },
          },
        },
      },
    });

    if (segments.length === 0) {
      console.log(`    No segments found`);
      continue;
    }

    // Compute order
    const orderMap = computeSegmentOrder(initSegment, segments);

    // Check what needs updating
    const updates: SegmentOrder[] = [];
    for (const segment of segments) {
      const computedOrder = orderMap.get(segment.segmentId);
      if (computedOrder === undefined) {
        console.log(`    ⚠️  No order computed for segment ${segment.segmentName}`);
        continue;
      }

      // Only update if order changed or is null
      if (segment.segmentOrder === null || segment.segmentOrder !== computedOrder) {
        updates.push({
          segmentId: segment.segmentId,
          segmentName: segment.segmentName,
          order: computedOrder,
        });
      }
    }

    console.log(`    Found ${segments.length} segments, ${updates.length} need updates`);

    if (updates.length > 0 && !dryRun) {
      // Update in batch
      for (const update of updates) {
        await prisma.segment.update({
          where: { segmentId: update.segmentId },
          data: { segmentOrder: update.order },
        });
      }
      console.log(`    ✅ Updated ${updates.length} segments`);
    } else if (updates.length > 0 && dryRun) {
      console.log(`    [DRY RUN] Would update:`);
      updates.forEach((u) => {
        console.log(`      - ${u.segmentName}: ${u.order}`);
      });
    } else {
      console.log(`    ✓ All segments already have correct order`);
    }

    totalProcessed += segments.length;
    totalUpdated += updates.length;
  }

  return { processed: totalProcessed, updated: totalUpdated };
}

/**
 * Main migration function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const routingIdArg = args.find((a) => a.startsWith('--routingId='));
  const specificRoutingId = routingIdArg?.split('=')[1];

  console.log('='.repeat(60));
  console.log('Segment Order Migration Script');
  console.log('='.repeat(60));
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }
  console.log('');

  try {
    // Get all routingIds
    let routingIds: string[];
    if (specificRoutingId) {
      routingIds = [specificRoutingId];
      console.log(`Processing specific routingId: ${specificRoutingId}`);
    } else {
      const routings = await prisma.routingTable.findMany({
        where: { isActive: true },
        select: { routingId: true },
        distinct: ['routingId'],
      });
      routingIds = routings.map((r) => r.routingId);
      console.log(`Found ${routingIds.length} routingIds to process`);
    }

    let totalProcessed = 0;
    let totalUpdated = 0;

    for (const routingId of routingIds) {
      const result = await processRoutingId(routingId, dryRun);
      totalProcessed += result.processed;
      totalUpdated += result.updated;
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total segments processed: ${totalProcessed}`);
    console.log(`Total segments updated: ${totalUpdated}`);
    if (dryRun) {
      console.log('\n🔍 This was a DRY RUN - no changes were made');
      console.log('Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ Migration completed successfully');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main();
