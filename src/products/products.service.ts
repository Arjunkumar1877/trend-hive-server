import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../data/entities/product.entity';
import { Category } from '../data/entities/category.entity';
import { Image } from '../data/entities/image.entity';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { FirebaseStorageService } from '../firebase/firebase-storage.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private firebaseStorageService: FirebaseStorageService,
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

    // If image URLs are provided, create image entities
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

      // Create new images with the provided URLs
      const images = updateProductDto.images.map((imageUrl, index) =>
        this.imageRepository.create({
          image: imageUrl,
          product,
          isCover: index === 0,
        } as Image),
      );
      await this.imageRepository.save(images);
    }

    // Update other product properties
    if (updateProductDto.name) product.name = updateProductDto.name;
    if (updateProductDto.price) product.price = updateProductDto.price;
    if (updateProductDto.description) product.description = updateProductDto.description;
    if (updateProductDto.availableQuantity !== undefined) {
      product.availableQuantity = updateProductDto.availableQuantity;
    }

    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  /**
   * Upload product images to Firebase Storage
   * @param files - Array of files to upload
   * @returns Promise<string[]> - Array of download URLs for the uploaded images
   */
  async uploadProductImages(files: any[]): Promise<string[]> {
    try {
      // Upload files to the 'products' folder in Firebase Storage
      const imageUrls = await this.firebaseStorageService.uploadMultipleFiles(files, 'products');
      return imageUrls;
    } catch (error) {
      throw new Error(`Failed to upload product images: ${error.message}`);
    }
  }

  /**
   * Add images to an existing product
   * @param productId - ID of the product to add images to
   * @param imageUrls - Array of image URLs to add
   * @returns Promise<Product> - The updated product
   */
  async addImagesToProduct(productId: number, imageUrls: string[]): Promise<Product> {
    const product = await this.findOne(productId);
    
    // Create new images with the provided URLs
    const images = imageUrls.map((imageUrl, index) =>
      this.imageRepository.create({
        image: imageUrl,
        product,
        isCover: index === 0 && product.images.length === 0, // Set as cover if it's the first image
      } as Image),
    );
    
    await this.imageRepository.save(images);
    
    return this.findOne(productId);
  }
}
