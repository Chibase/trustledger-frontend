/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["<rootDir>/tests/ledgerVectors.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          isolatedModules: true,
          types: ["jest", "node"],
          target: "ES2020",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
};
