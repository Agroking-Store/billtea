import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RequireSubscription } from '../common/decorators/subscription.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";

@UseGuards(JwtAuthGuard, SubscriptionGuard, FeatureGuard)
@Controller('quotations')
@ApiTags('Quotation')
@ApiBearerAuth()
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Get('customers/search')
    @ApiOperation({ summary: 'Search Customers' })
    @ApiResponse({ status: 200, description: 'Successful operation.' })
  searchCustomers(
    @CurrentUser() user: any,
    @Query('q') query: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.quotationService.searchCustomers(query, user.companyId, branchId);
  }

  @Get('products/search')
    @ApiOperation({ summary: 'Search Products' })
    @ApiResponse({ status: 200, description: 'Successful operation.' })
  searchProducts(
    @CurrentUser() user: any,
    @Query('q') query: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.quotationService.searchProducts(query, user.companyId, branchId);
  }

  @Post('preview')
    @ApiOperation({ summary: 'Preview' })
    @ApiResponse({ status: 201, description: 'Created successfully.' })
  preview(@CurrentUser() user: any, @Body() createQuotationDto: CreateQuotationDto) {
    return this.quotationService.calculatePreview(user.companyId, user.userId, createQuotationDto);
  }

  @Post()
  @RequireSubscription('quotation')
  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'Created successfully.' })
  create(@CurrentUser() user: any, @Body() createQuotationDto: CreateQuotationDto) {
    return this.quotationService.create(user.companyId, user.userId, createQuotationDto);
  }

  @Get()
    @ApiOperation({ summary: 'Find All' })
    @ApiResponse({ status: 200, description: 'Successful operation.' })
  findAll(
    @CurrentUser() user: any, 
    @Query('branchId') branchId?: string,
    @Query('withoutInvoice') withoutInvoice?: string
  ) {
    const isWithoutInvoice = withoutInvoice === 'true';
    return this.quotationService.findAll(user.companyId, branchId, isWithoutInvoice);
  }

  @Get(':id')
    @ApiOperation({ summary: 'Find One' })
    @ApiResponse({ status: 200, description: 'Successful operation.' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quotationService.findOne(id, user.companyId);
  }

  @Get(':id/pdf')
    @ApiOperation({ summary: 'Download Pdf' })
    @ApiResponse({ status: 200, description: 'Successful operation.' })
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const buffer = await this.quotationService.generatePdf(id, user.companyId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quotation-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    
    return new StreamableFile(buffer);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'application/pdf' ||
          file.mimetype.startsWith('image/') ||
          file.mimetype === 'application/octet-stream' && file.originalname.toLowerCase().endsWith('.heic')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF and Images are allowed'), false);
        }
      },
    }),
  )
    @ApiOperation({ summary: 'Upload Attachment' })
    @ApiResponse({ status: 201, description: 'Created successfully.' })
  uploadAttachment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.quotationService.uploadAttachment(id, user.companyId, file);
  }

  @Put(':id')
    @ApiOperation({ summary: 'Update' })
    @ApiResponse({ status: 200, description: 'Successful operation.' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateQuotationDto: UpdateQuotationDto,
  ) {
    return this.quotationService.update(id, user.companyId, user.userId, updateQuotationDto);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Remove' })
    @ApiResponse({ status: 200, description: 'Successful operation.' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.quotationService.remove(id, user.companyId);
  }
}
