import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../data/entities/product.entity';
import { Category } from '../data/entities/category.entity';
import { Image } from '../data/entities/image.entity';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = this.productRepository.create({
      name: createProductDto.name,
      price: createProductDto.price,
      description: createProductDto.description,
      availableQuantity: createProductDto.availableQuantity,
      category,
    } as Product);

    const savedProduct = await this.productRepository.save(product);

    if (createProductDto.images && createProductDto.images.length > 0) {
      const images = createProductDto.images.map((imageUrl, index) =>
        this.imageRepository.create({
          image: imageUrl,
          product: savedProduct,
          isCover: index === 0,
        } as Image),
      );
      await this.imageRepository.save(images);
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category', 'images'],
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
      product.category = category;
    }

    if (updateProductDto.images && updateProductDto.images.length > 0) {
      // Delete existing images
      await this.imageRepository.delete({ product: { id } });

      // Create new images
      const images = updateProductDto.images.map((imageUrl, index) =>
        this.imageRepository.create({
          image: imageUrl,
          product,
          isCover: index === 0,
        } as Image),
      );
      await this.imageRepository.save(images);
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
