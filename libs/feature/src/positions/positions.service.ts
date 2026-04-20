import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, type PositionModel } from '@ube-hr/backend';
import { type PaginatedResponse } from '@ube-hr/shared';

export interface CreatePositionInput {
  name: string;
  description?: string;
}

export interface UpdatePositionInput {
  name?: string;
  description?: string | null;
}

const VALID_POS_SORT = ['name', 'createdAt'] as const;
type PosSortField = (typeof VALID_POS_SORT)[number];

export interface PositionsQuery {
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: string | number;
  pageSize?: string | number;
}

export type PositionRecord = PositionModel;

export type PaginatedPositions = PaginatedResponse<PositionRecord>;

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePositionInput): Promise<PositionRecord> {
    const existing = await this.prisma.position.findUnique({
      where: { name: input.name },
    });
    if (existing)
      throw new ConflictException('Position with this name already exists');

    return this.prisma.position.create({ data: input });
  }

  async findAll(query: PositionsQuery = {}): Promise<PaginatedPositions> {
    const { search, sortField, sortDir, page, pageSize } = query;

    const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(String(pageSize ?? 10), 10) || 10),
    );

    const validSort: PosSortField = (
      VALID_POS_SORT as readonly string[]
    ).includes(sortField ?? '')
      ? (sortField as PosSortField)
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
      this.prisma.position.count({ where }),
      this.prisma.position.findMany({
        where,
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

  async findById(id: number): Promise<PositionRecord> {
    const pos = await this.prisma.position.findUnique({
      where: { id, deletedAt: null },
    });
    if (!pos) throw new NotFoundException('Position not found');
    return pos;
  }

  async update(
    id: number,
    input: UpdatePositionInput,
  ): Promise<PositionRecord> {
    const existing = await this.findById(id);

    if (input.name && input.name !== existing.name) {
      const conflict = await this.prisma.position.findFirst({
        where: { name: input.name, deletedAt: null, id: { not: id } },
      });
      if (conflict)
        throw new ConflictException('Position with this name already exists');
    }

    return this.prisma.position.update({ where: { id }, data: input });
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.prisma.position.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
