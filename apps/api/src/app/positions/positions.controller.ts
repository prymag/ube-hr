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
  PositionsService,
  PermissionGuard,
  RequirePermission,
  type PositionRecord,
} from '@ube-hr/feature';
import {
  PERMISSIONS,
  type PositionResponse,
  type PaginatedResponse,
} from '@ube-hr/shared';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionResponseDto } from './dto/position-response.dto';

function toPositionResponse(pos: PositionRecord): PositionResponse {
  return {
    id: pos.id,
    name: pos.name,
    description: pos.description,
    reportsToId: pos.reportsToId,
    reportsToName: pos.reportsTo?.name ?? null,
    createdAt: pos.createdAt.toISOString(),
    updatedAt: pos.updatedAt.toISOString(),
  };
}

@ApiTags('positions')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.POSITIONS_CREATE)
  @ApiOperation({ summary: 'Create a position' })
  @ApiCreatedResponse({ type: PositionResponseDto })
  async create(@Body() dto: CreatePositionDto): Promise<PositionResponse> {
    const pos = await this.positionsService.create(dto);
    return toPositionResponse(pos);
  }

  @Get()
  @RequirePermission(PERMISSIONS.POSITIONS_READ)
  @ApiOperation({ summary: 'List positions with search, sort and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('sortField') sortField?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<PositionResponse>> {
    const result = await this.positionsService.findAll({
      search,
      sortField,
      sortDir,
      page,
      pageSize,
    });
    return { ...result, data: result.data.map(toPositionResponse) };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.POSITIONS_READ)
  @ApiOperation({ summary: 'Get position details' })
  @ApiOkResponse({ type: PositionResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PositionResponse> {
    const pos = await this.positionsService.findById(id);
    return toPositionResponse(pos);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.POSITIONS_UPDATE)
  @ApiOperation({ summary: 'Update a position' })
  @ApiOkResponse({ type: PositionResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePositionDto,
  ): Promise<PositionResponse> {
    const pos = await this.positionsService.update(id, dto);
    return toPositionResponse(pos);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.POSITIONS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a position' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.positionsService.remove(id);
  }
}
