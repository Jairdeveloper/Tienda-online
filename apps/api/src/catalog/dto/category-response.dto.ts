import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Electrónica' })
  name!: string;

  @ApiProperty({ example: 'electronica' })
  slug!: string;

  @ApiProperty({ example: { icon: 'laptop' }, required: false })
  metadata?: Record<string, unknown>;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  createdAt!: Date;

  static from(entity: { id: string; name: string; slug: string; metadata?: unknown; createdAt: Date }): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    dto.metadata = entity.metadata as Record<string, unknown> | undefined;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
