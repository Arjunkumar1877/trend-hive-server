import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../data/schemas/product.schema';
import { Category, CategoryDocument } from '../data/schemas/category.schema';
import { Image, ImageDocument } from '../data/schemas/image.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  GetProductsQueryDto,
  PaginatedProductsResponseDto,
} from './product.dto';
import { FirebaseStorageService } from '../firebase/firebase-storage.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(Image.name)
    private imageModel: Model<ImageDocument>,
    private firebaseStorageService: FirebaseStorageService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    const category = await this.categoryModel.findById(createProductDto.categoryId).exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = new this.productModel({
      name: createProductDto.name,
      price: createProductDto.price,
      description: createProductDto.description,
      availableQuantity: createProductDto.availableQuantity,
      category: category._id,
    });

    const savedProduct = await product.save();

    // If image URLs are provided, create image entities
    if (createProductDto.images && createProductDto.images.length > 0) {
      const images = createProductDto.images.map((imageUrl, index) =>
        new this.imageModel({
          image: imageUrl,
          product: savedProduct._id,
          isCover: index === 0,
        }),
      );
      await this.imageModel.insertMany(images);
    }

    return this.findOne(savedProduct._id.toString());
  }

  async findAll(query: GetProductsQueryDto): Promise<PaginatedProductsResponseDto> {
    const filter: FilterQuery<ProductDocument> = {};

    if (query.search) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }

    if (query.categoryId && Types.ObjectId.isValid(query.categoryId)) {
      filter.category = new Types.ObjectId(query.categoryId);
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilters: Record<string, number> = {};
      if (query.minPrice !== undefined) {
        priceFilters.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        priceFilters.$lte = query.maxPrice;
      }

      filter.price = priceFilters as unknown as number;
    }

    if (query.inStock !== undefined) {
      filter.availableQuantity = query.inStock ? ({ $gt: 0 } as any) : ({ $lte: 0 } as any);
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [products, totalItems] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category')
        .populate('images')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      data: products,
      meta: {
        totalItems,
        totalPages,
        page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).populate('category').populate('images').exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.findOne(id);

    if (updateProductDto.categoryId) {
      const category = await this.categoryModel.findById(updateProductDto.categoryId).exec();

      if (!category) {
        throw new NotFoundException('Category not found');
      }
      product.category = category._id;
    }

    if (updateProductDto.images && updateProductDto.images.length > 0) {
      // Delete existing images
      await this.imageModel.deleteMany({ product: product._id }).exec();

      // Create new images with the provided URLs
      const images = updateProductDto.images.map((imageUrl, index) =>
        new this.imageModel({
          image: imageUrl,
          product: product._id,
          isCover: index === 0,
        }),
      );
      await this.imageModel.insertMany(images);
    }

    // Update other product properties
    if (updateProductDto.name) product.name = updateProductDto.name;
    if (updateProductDto.price) product.price = updateProductDto.price;
    if (updateProductDto.description) product.description = updateProductDto.description;
    if (updateProductDto.availableQuantity !== undefined) {
      product.availableQuantity = updateProductDto.availableQuantity;
    }

    return product.save();
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    // Delete associated images
    await this.imageModel.deleteMany({ product: product._id }).exec();
    await product.deleteOne();
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
   * @returns Promise<ProductDocument> - The updated product
   */
  async addImagesToProduct(productId: string, imageUrls: string[]): Promise<ProductDocument> {
    const product = await this.findOne(productId);
    
    // Create new images with the provided URLs
    const images = imageUrls.map((imageUrl, index) =>
      new this.imageModel({
        image: imageUrl,
        product: product._id,
        isCover: index === 0 && (!product.images || product.images.length === 0), // Set as cover if it's the first image
      }),
    );
    
    await this.imageModel.insertMany(images);
    
    return this.findOne(productId);
  }
}
