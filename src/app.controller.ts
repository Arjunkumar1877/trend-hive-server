import {
  Controller,
  Get,
  Post,
  Query,
  Response,
  UploadedFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('')
  getHello(): string {
     return this.appService.getHello();
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
     schema: {
        type: 'object',
        properties: {
           file: {
              type: 'string',
              format: 'binary'
           }
        }
     }
  })
  @ApiQuery({
     name: 'type',
     required: false
  })
  async uploadFile(@UploadedFile() file: any, @Response() res, @Query('type') type: string) {
     const data = await this.appService.uploadFile({ file, type });
     return res.status(200).json(data);
  }

  @UseInterceptors(FilesInterceptor('files'))
  @Post('/upload-multiple')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
     schema: {
        type: 'object',
        properties: {
           files: {
              type: 'array',
              items: {
                 type: 'string',
                 format: 'binary'
              }
           }
        }
     }
  })
  @ApiQuery({
     name: 'type',
     required: false
  })
  async uploadFiles(
     @UploadedFiles() files: Array<any>,
     @Response() res,
     @Query('type') type?: string
  ) {
     const uploadResults = await Promise.all(
        files.map((file) => this.appService.uploadFileAndGetOneUrl({ file, type: type || '' }))
     );

     return res.status(200).json(uploadResults);
  }
}