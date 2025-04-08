import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsNumber()
  availableQuantity: number;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  images?: string[];
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  availableQuantity?: number;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  images?: string[];
}

export class AddImagesToProductDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  imageUrls: string[];
} 