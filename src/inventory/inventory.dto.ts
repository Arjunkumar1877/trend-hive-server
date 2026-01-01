import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @ApiProperty({
    description: 'Stock adjustment amount (positive to add, negative to subtract)',
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  adjustment: number;

  @ApiProperty({
    description: 'Reason for stock adjustment',
    example: 'Restocking from supplier',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SetStockDto {
  @ApiProperty({
    description: 'New stock quantity',
    example: 100,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;
}


