import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  AddImagesToProductDto,
  GetProductsQueryDto,
  PaginatedProductsResponseDto,
} from './product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Product } from '../data/schemas/product.schema';
import { FilesInterceptor } from '@nestjs/platform-express';
// JwtAuthGuard removed, using AuthGuard('jwt') directly
// Wait, I need to check if JwtAuthGuard exists. It was not in the file list earlier. 
// auth folder had: auth.controller.spec.ts, auth.controller.ts, auth.dto.ts, auth.module.ts, auth.service.spec.ts, auth.service.ts, jwt.startegy.ts.
// It seems I might need to Create JwtAuthGuard or use AuthGuard('jwt').
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: Product })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('upload-images')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
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
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add images to an existing product' })
  @ApiResponse({ status: 200, description: 'Images added to product successfully', type: Product })
  async addImagesToProduct(
    @Param('id') id: string,
    @Body() addImagesDto: AddImagesToProductDto,
  ) {
    return this.productsService.addImagesToProduct(id, addImagesDto.imageUrls);
  }

  @Get()
  @ApiOperation({ summary: 'Get products with filtering, sorting, and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Return products with metadata',
    type: PaginatedProductsResponseDto,
  })
  findAll(@Query() query: GetProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Return the product', type: Product })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: Product })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
