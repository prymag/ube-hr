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
  DepartmentsService,
  PermissionGuard,
  RequirePermission,
  type DepartmentRecord,
} from '@ube-hr/feature';
import {
  PERMISSIONS,
  type DepartmentResponse,
  type PaginatedResponse,
} from '@ube-hr/shared';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';

function toDepartmentResponse(dept: DepartmentRecord): DepartmentResponse {
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    headId: dept.headId,
    headName: dept.head?.name ?? null,
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  };
}

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.DEPARTMENTS_CREATE)
  @ApiOperation({ summary: 'Create a department' })
  @ApiCreatedResponse({ type: DepartmentResponseDto })
  async create(@Body() dto: CreateDepartmentDto): Promise<DepartmentResponse> {
    const dept = await this.departmentsService.create(dto);
    return toDepartmentResponse(dept);
  }

  @Get()
  @RequirePermission(PERMISSIONS.DEPARTMENTS_READ)
  @ApiOperation({
    summary: 'List departments with search, sort and pagination',
  })
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
  ): Promise<PaginatedResponse<DepartmentResponse>> {
    const result = await this.departmentsService.findAll({
      search,
      sortField,
      sortDir,
      page,
      pageSize,
    });
    return { ...result, data: result.data.map(toDepartmentResponse) };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.DEPARTMENTS_READ)
  @ApiOperation({ summary: 'Get department details' })
  @ApiOkResponse({ type: DepartmentResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DepartmentResponse> {
    const dept = await this.departmentsService.findById(id);
    return toDepartmentResponse(dept);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.DEPARTMENTS_UPDATE)
  @ApiOperation({ summary: 'Update a department' })
  @ApiOkResponse({ type: DepartmentResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponse> {
    const dept = await this.departmentsService.update(id, dto);
    return toDepartmentResponse(dept);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.DEPARTMENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.departmentsService.remove(id);
  }
}
