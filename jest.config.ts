import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/features"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFiles: ["<rootDir>/jest.env.ts"],
  clearMocks: true,
  collectCoverageFrom: [
    "features/auth/**/*.ts",
    "features/data/repositories/**/*.ts",
    "!**/*.d.ts",
  ],
};

export default config;
