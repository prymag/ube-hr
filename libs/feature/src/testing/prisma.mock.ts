export const createPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  team: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  membership: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  rolePermission: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;
