module.exports = {
	verbose: true,
	rootDir: '.',
	roots: ['<rootDir>/src/', '<rootDir>/tests/'],
	collectCoverage: true,
	collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
	moduleDirectories: ['node_modules'],
	// ignoring node modules and main entry point
	coveragePathIgnorePatterns: ['/node_modules/'],
};
