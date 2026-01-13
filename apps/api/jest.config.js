module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/__tests__/**/*.spec.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.jest.json"
    }
  },
  moduleNameMapper: {
    "^@school-egp/shared$": "<rootDir>/../../packages/shared/src",
    "^@school-egp/shared/(.*)$": "<rootDir>/../../packages/shared/src/$1"
  }
};
