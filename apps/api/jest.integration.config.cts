module.exports = {
  displayName: 'api-integration',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.integration.json', useESM: true }],
  },
  testMatch: ['<rootDir>/src/app/**/*.integration.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    // Resolve workspace path aliases (from tsconfig.base.json paths).
    // No redirect for generated/prisma/client — integration tests use the real Prisma client.
    '^@ube-hr/feature$': '<rootDir>/../../libs/feature/src/index.ts',
    '^@ube-hr/shared$': '<rootDir>/../../libs/shared/src/index.ts',
    '^@ube-hr/ui$': '<rootDir>/../../libs/ui/src/index.ts',
    '^@ube-hr/backend$': '<rootDir>/../../libs/backend/src/index.ts',
    '^@ube-hr/prisma-models$': '<rootDir>/../../generated/prisma/models.ts',
    '^@ube-hr/prisma-enums$': '<rootDir>/../../generated/prisma/enums.ts',
  },
};
