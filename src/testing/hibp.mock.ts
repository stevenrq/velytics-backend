// `hibp` ships ESM-only (no CJS build), which Jest's CommonJS transform
// cannot parse. Every test suite is routed here via moduleNameMapper (see
// package.json "jest" config and test/jest-e2e.json) instead of importing
// the real package, so unit tests can control pwnedPassword's resolved
// value and e2e runs never depend on network access to the HIBP API.
export const pwnedPassword = jest.fn().mockResolvedValue(0);
