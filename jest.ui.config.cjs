/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  testMatch: [
    "<rootDir>/tests/ts/AuditTrailViewer.test.tsx",
    "<rootDir>/tests/ts/vipShowcase.test.ts",
    "<rootDir>/tests/ts/sepExecution.test.ts",
    "<rootDir>/tests/ts/sepExecutionDashboard.test.tsx",
    "<rootDir>/tests/ts/planPackaging.test.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
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
          jsx: "react-jsx",
          types: ["jest", "node"],
          target: "ES2020",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
};
