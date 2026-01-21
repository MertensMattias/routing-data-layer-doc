import { ApiProperty } from '@nestjs/swagger';

/**
 * Impact analysis DTO for routing entry deletion
 * Shows what would be affected if a routing entry were deleted
 */
export class RoutingEntryImpactDto {
  @ApiProperty({
    description: 'Routing table entry ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  routingTableId!: string;

  @ApiProperty({
    description: 'Source ID (unique identifier)',
    example: '+3212345678',
  })
  sourceId!: string;

  @ApiProperty({
    description: 'Routing ID (groups related entries)',
    example: 'EEBL-ENERGYLINE-MAIN',
  })
  routingId!: string;

  @ApiProperty({
    description: 'Number of active segments referencing this routingId',
    example: 5,
  })
  segmentCount!: number;

  @ApiProperty({
    description: 'Number of other active routing entries with the same routingId',
    example: 2,
  })
  otherRoutingEntriesCount!: number;

  @ApiProperty({
    description: 'Number of version history snapshots for this routingId',
    example: 3,
  })
  versionHistoryCount!: number;

  @ApiProperty({
    description: 'Total usage count (segments + other entries)',
    example: 7,
  })
  totalUsage!: number;

  @ApiProperty({
    description: 'Whether there are blocking issues preventing deletion',
    example: false,
  })
  hasBlockingIssues!: boolean;

  @ApiProperty({
    description: 'List of reasons why deletion might be blocked',
    type: [String],
    example: ['5 active segments reference this routingId'],
  })
  blockingReasons!: string[];

  @ApiProperty({
    description: 'Recommendation message',
    example: 'Safe to delete - no active segments reference this routingId',
    required: false,
  })
  recommendation?: string;
}
