/** Testes unitários: arquivos *.spec.ts dentro de src/. Os e2e ficam em test/. */
module.exports = {
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }] },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
};
