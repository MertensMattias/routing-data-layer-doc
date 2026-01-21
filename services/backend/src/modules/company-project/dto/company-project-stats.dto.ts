import { ApiProperty } from '@nestjs/swagger';

export class CompanyProjectStatsDto {
  @ApiProperty({
    description: 'Company project ID',
    example: 1,
  })
  companyProjectId!: number;

  @ApiProperty({
    description: 'Total count of active message stores in this project',
    example: 3,
  })
  messageStoreCount!: number;

  @ApiProperty({
    description: 'Total count of active routing table entries in this project',
    example: 2,
  })
  routingTableCount!: number;

  @ApiProperty({
    description: 'Total count of active segments across all routing tables in this project',
    example: 5,
  })
  segmentCount!: number;
}
