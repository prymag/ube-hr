module.exports = {
  displayName: 'feature',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/feature',
  moduleNameMapper: {
    // The generated Prisma client uses import.meta.url (ESM-only, incompatible with Jest CJS).
    // Redirect to a minimal stub; PrismaService is always provided via useValue in unit tests,
    // so this class is never instantiated. Everything else in @ube-hr/backend loads from source.
    '^@ube-hr/prisma-client$': '<rootDir>/src/testing/prisma-client.stub.ts',
    '^.+/generated/prisma/client$':
      '<rootDir>/src/testing/prisma-client.stub.ts',
  },
};
