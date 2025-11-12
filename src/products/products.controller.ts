import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, UploadedFile, Query, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, AddImagesToProductDto } from './product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Product } from '../data/schemas/product.schema';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: Product })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload product images' })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully', type: [String] })
  async uploadImages(@UploadedFiles() files: any[]) {
    // Validate files according to Firebase Storage rules
    for (const file of files) {
      // Check file size (20MB limit)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxSize) {
        throw new BadRequestException(`File ${file.originalname} exceeds the 20MB size limit`);
      }
      
      // Check file type (only images allowed for products)
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(`File ${file.originalname} is not an image. Only image files are allowed.`);
      }
    }
    
    const imageUrls = await this.productsService.uploadProductImages(files);
    return { imageUrls };
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add images to an existing product' })
  @ApiResponse({ status: 200, description: 'Images added to product successfully', type: Product })
  async addImagesToProduct(
    @Param('id') id: string,
    @Body() addImagesDto: AddImagesToProductDto,
  ) {
    return this.productsService.addImagesToProduct(id, addImagesDto.imageUrls);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Return all products', type: [Product] })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Return the product', type: Product })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: Product })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
