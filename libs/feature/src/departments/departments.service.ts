import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, type DepartmentModel } from '@ube-hr/backend';
import { type PaginatedResponse } from '@ube-hr/shared';

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  headId?: number | null;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string | null;
  headId?: number | null;
}

const VALID_DEPT_SORT = ['name', 'createdAt'] as const;
type DeptSortField = (typeof VALID_DEPT_SORT)[number];

export interface DepartmentsQuery {
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: string | number;
  pageSize?: string | number;
}

export type DepartmentRecord = DepartmentModel & {
  head: { id: number; name: string | null } | null;
};

export type PaginatedDepartments = PaginatedResponse<DepartmentRecord>;

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDepartmentInput): Promise<DepartmentRecord> {
    const existing = await this.prisma.department.findUnique({
      where: { name: input.name },
    });
    if (existing) throw new ConflictException('Department name already exists');

    if (input.headId) {
      await this.validateUser(input.headId);
    }

    return this.prisma.department.create({
      data: input,
      include: { head: { select: { id: true, name: true } } },
    });
  }

  async findAll(query: DepartmentsQuery = {}): Promise<PaginatedDepartments> {
    const { search, sortField, sortDir, page, pageSize } = query;

    const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(String(pageSize ?? 10), 10) || 10),
    );

    const validSort: DeptSortField = (
      VALID_DEPT_SORT as readonly string[]
    ).includes(sortField ?? '')
      ? (sortField as DeptSortField)
      : 'name';
    const validDir = sortDir === 'desc' ? 'desc' : ('asc' as const);

    const where = {
      deletedAt: null as null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.department.count({ where }),
      this.prisma.department.findMany({
        where,
        include: { head: { select: { id: true, name: true } } },
        orderBy: { [validSort]: validDir },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      pageCount: Math.max(1, Math.ceil(total / pageSizeNum)),
    };
  }

  async findById(id: number): Promise<DepartmentRecord> {
    const dept = await this.prisma.department.findUnique({
      where: { id, deletedAt: null },
      include: { head: { select: { id: true, name: true } } },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(
    id: number,
    input: UpdateDepartmentInput,
  ): Promise<DepartmentRecord> {
    await this.findById(id);

    if (input.name) {
      const conflict = await this.prisma.department.findFirst({
        where: { name: input.name, deletedAt: null, id: { not: id } },
      });
      if (conflict)
        throw new ConflictException('Department name already exists');
    }

    if (input.headId) {
      await this.validateUser(input.headId);
    }

    return this.prisma.department.update({
      where: { id },
      data: input,
      include: { head: { select: { id: true, name: true } } },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async validateUser(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
  }
}
