const fs = require("fs");
const path = require("path");

const swcConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, ".swcrc"), "utf8")
);

/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  testRegex: ".*__tests__/.+(.test.(ts|js|tsx|jsx))$",
  transform: {
    "^.+.(js|jsx|ts|tsx)$": ["@swc/jest", swcConfig],
  },
  moduleNameMapper: {
    "^@src(.*)$": "<rootDir>/src/$1",
    "@src": "<rootDir>/src/index",
  },
  roots: ["<rootDir>"],
  collectCoverageFrom: ["src/**/*.(ts|js|tsx|jsx)"],
  coverageReporters: ["html", "text"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/coverage/",
    "/__mocks__/",
    "/__tests__/",
    "/dist/",
    "/.husky/",
    "/.vscode/",
  ],
};
