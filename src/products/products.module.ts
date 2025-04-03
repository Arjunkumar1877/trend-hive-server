import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../data/entities/product.entity';
import { Category } from '../data/entities/category.entity';
import { Image } from '../data/entities/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Image])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
