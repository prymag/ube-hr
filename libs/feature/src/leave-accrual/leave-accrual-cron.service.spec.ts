import { Test } from '@nestjs/testing';
import { LeaveAccrualCronService } from './leave-accrual-cron.service';
import { LeaveAccrualService } from './leave-accrual.service';

const createAccrualServiceMock = () => ({
  triggerAccrualRun: jest
    .fn()
    .mockResolvedValue({ runId: 'test-run', jobsEnqueued: 0 }),
});

describe('LeaveAccrualCronService', () => {
  let cronService: LeaveAccrualCronService;
  let accrualService: ReturnType<typeof createAccrualServiceMock>;

  beforeEach(async () => {
    accrualService = createAccrualServiceMock();

    const module = await Test.createTestingModule({
      providers: [
        LeaveAccrualCronService,
        { provide: LeaveAccrualService, useValue: accrualService },
      ],
    }).compile();

    cronService = module.get(LeaveAccrualCronService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('runMonthlyAccrual', () => {
    const runWithDate = async (year: number, month: number) => {
      // month is 0-indexed JS month
      jest.useFakeTimers();
      jest.setSystemTime(new Date(year, month, 1).getTime());
      await cronService.runMonthlyAccrual();
      jest.useRealTimers();
      return accrualService.triggerAccrualRun.mock.calls[0] as [number, number];
    };

    it.each([
      // [currentYear, jsMonth(0-idx), expectedYear, expectedMonth(1-idx)]
      [2026, 1, 2026, 1], // Feb → Jan
      [2026, 2, 2026, 2], // Mar → Feb
      [2026, 3, 2026, 3], // Apr → Mar
      [2026, 4, 2026, 4], // May → Apr
      [2026, 5, 2026, 5], // Jun → May
      [2026, 6, 2026, 6], // Jul → Jun
      [2026, 7, 2026, 7], // Aug → Jul
      [2026, 8, 2026, 8], // Sep → Aug
      [2026, 9, 2026, 9], // Oct → Sep
      [2026, 10, 2026, 10], // Nov → Oct
      [2026, 11, 2026, 11], // Dec → Nov
    ])(
      'computes correct previous month: currentMonth=%s/%s → %s/%s',
      async (currentYear, jsMonth, expectedYear, expectedMonth) => {
        const [year, month] = await runWithDate(currentYear, jsMonth);
        expect(year).toBe(expectedYear);
        expect(month).toBe(expectedMonth);
      },
    );

    it('handles year rollback: January → December of prior year', async () => {
      const [year, month] = await runWithDate(2026, 0); // January 2026
      expect(year).toBe(2025);
      expect(month).toBe(12);
    });

    it('delegates to LeaveAccrualService.triggerAccrualRun with correct args', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1).getTime()); // May 2026 → April 2026

      await cronService.runMonthlyAccrual();

      expect(accrualService.triggerAccrualRun).toHaveBeenCalledTimes(1);
      expect(accrualService.triggerAccrualRun).toHaveBeenCalledWith(2026, 4);

      jest.useRealTimers();
    });
  });
});
