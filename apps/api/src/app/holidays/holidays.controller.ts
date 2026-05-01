import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  HolidaysService,
  PermissionGuard,
  RequirePermission,
  type HolidayRecord,
} from '@ube-hr/feature';
import {
  PERMISSIONS,
  type PublicHolidayResponse,
  type PaginatedResponse,
} from '@ube-hr/shared';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { HolidayResponseDto } from './dto/holiday-response.dto';

function toHolidayResponse(h: HolidayRecord): PublicHolidayResponse {
  return {
    id: h.id,
    name: h.name,
    date: h.date.toISOString(),
    description: h.description,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}

@ApiTags('holidays')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  @RequirePermission(PERMISSIONS.HOLIDAYS_MANAGE)
  @ApiOperation({ summary: 'Create a public holiday' })
  @ApiCreatedResponse({ type: HolidayResponseDto })
  async create(@Body() dto: CreateHolidayDto): Promise<PublicHolidayResponse> {
    const holiday = await this.holidaysService.create({
      name: dto.name,
      date: new Date(dto.date),
      description: dto.description,
    });
    return toHolidayResponse(holiday);
  }

  @Get()
  @RequirePermission(PERMISSIONS.HOLIDAYS_MANAGE)
  @ApiOperation({ summary: 'List public holidays' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Query('year') year?: string,
    @Query('sortField') sortField?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<PublicHolidayResponse>> {
    const result = await this.holidaysService.findAll({
      year,
      sortField,
      sortDir,
      page,
      pageSize,
    });
    return { ...result, data: result.data.map(toHolidayResponse) };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.HOLIDAYS_MANAGE)
  @ApiOperation({ summary: 'Get a public holiday by id' })
  @ApiOkResponse({ type: HolidayResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PublicHolidayResponse> {
    const holiday = await this.holidaysService.findById(id);
    return toHolidayResponse(holiday);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.HOLIDAYS_MANAGE)
  @ApiOperation({ summary: 'Update a public holiday' })
  @ApiOkResponse({ type: HolidayResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHolidayDto,
  ): Promise<PublicHolidayResponse> {
    const holiday = await this.holidaysService.update(id, {
      name: dto.name,
      date: dto.date ? new Date(dto.date) : undefined,
      description: dto.description,
    });
    return toHolidayResponse(holiday);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.HOLIDAYS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a public holiday' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.holidaysService.remove(id);
  }
}
