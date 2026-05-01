import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ube-hr/backend';
import type { PublicHolidayModel } from '@ube-hr/prisma-models';
import type { PaginatedResponse } from '@ube-hr/shared';

export interface CreateHolidayInput {
  name: string;
  date: Date;
  description?: string;
}

export interface UpdateHolidayInput {
  name?: string;
  date?: Date;
  description?: string | null;
}

export interface HolidaysQuery {
  year?: string | number;
  sortField?: string;
  sortDir?: string;
  page?: string | number;
  pageSize?: string | number;
}

export type HolidayRecord = PublicHolidayModel;

export type PaginatedHolidays = PaginatedResponse<HolidayRecord>;

const VALID_HOLIDAY_SORT = ['name', 'date', 'createdAt'] as const;
type HolidaySortField = (typeof VALID_HOLIDAY_SORT)[number];

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateHolidayInput): Promise<HolidayRecord> {
    const existing = await this.prisma.publicHoliday.findUnique({
      where: { date: input.date },
    });
    if (existing)
      throw new ConflictException('A holiday already exists on that date');

    return this.prisma.publicHoliday.create({ data: input });
  }

  async findAll(query: HolidaysQuery = {}): Promise<PaginatedHolidays> {
    const { year, sortField, sortDir, page, pageSize } = query;

    const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
    const pageSizeNum = Math.min(
      100,
      Math.max(1, parseInt(String(pageSize ?? 10), 10) || 10),
    );

    const validSort: HolidaySortField = (
      VALID_HOLIDAY_SORT as readonly string[]
    ).includes(sortField ?? '')
      ? (sortField as HolidaySortField)
      : 'date';
    const validDir = sortDir === 'desc' ? 'desc' : ('asc' as const);

    const yearNum = year ? parseInt(String(year), 10) : undefined;

    const where = yearNum
      ? {
          date: {
            gte: new Date(`${yearNum}-01-01`),
            lt: new Date(`${yearNum + 1}-01-01`),
          },
        }
      : {};

    const [total, data] = await Promise.all([
      this.prisma.publicHoliday.count({ where }),
      this.prisma.publicHoliday.findMany({
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

  async findById(id: number): Promise<HolidayRecord> {
    const holiday = await this.prisma.publicHoliday.findUnique({
      where: { id },
    });
    if (!holiday) throw new NotFoundException('Holiday not found');
    return holiday;
  }

  async update(id: number, input: UpdateHolidayInput): Promise<HolidayRecord> {
    await this.findById(id);

    if (input.date) {
      const conflict = await this.prisma.publicHoliday.findFirst({
        where: { date: input.date, id: { not: id } },
      });
      if (conflict)
        throw new ConflictException('A holiday already exists on that date');
    }

    return this.prisma.publicHoliday.update({ where: { id }, data: input });
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.prisma.publicHoliday.delete({ where: { id } });
  }

  /**
   * Count working days (Mon–Fri) between start and end (inclusive), minus any
   * weekday public holidays that fall in the range.
   * If isHalfDay is true, returns 0.5 regardless of the range (single-day).
   */
  async countWorkingDays(
    start: Date,
    end: Date,
    halfDay: 'AM' | 'PM' | null,
  ): Promise<number> {
    if (halfDay !== null) return 0.5;

    const startMs = start.getTime();
    const endMs = end.getTime();

    let workingDays = 0;
    const cursor = new Date(startMs);
    while (cursor.getTime() <= endMs) {
      const dow = cursor.getDay(); // 0=Sun, 6=Sat
      if (dow !== 0 && dow !== 6) workingDays++;
      cursor.setDate(cursor.getDate() + 1);
    }

    // Subtract weekday public holidays in range
    const holidays = await this.prisma.publicHoliday.findMany({
      where: { date: { gte: start, lte: end } },
      select: { date: true },
    });

    for (const { date } of holidays) {
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) workingDays--;
    }

    return workingDays;
  }
}
