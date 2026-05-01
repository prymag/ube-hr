module.exports = {
  displayName: 'worker',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/worker',
  moduleNameMapper: {
    '^@ube-hr/prisma-client$': '<rootDir>/../../libs/feature/src/testing/prisma-client.stub.ts',
    '^.+/generated/prisma/client$': '<rootDir>/../../libs/feature/src/testing/prisma-client.stub.ts',
  },
};
