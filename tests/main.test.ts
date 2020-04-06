import runInCleanedDatabase from './utils/runInCleanedDatabase';
import {
	getSuite,
	authRoutesSuite,
	graphQlAuthRoutesSuite,
	userLoggedRoutesSuite,
} from './suites';

describe('Tests to run sequentially in cleaned database', () => {
	runInCleanedDatabase(getSuite);
	runInCleanedDatabase(authRoutesSuite);
	runInCleanedDatabase(graphQlAuthRoutesSuite);
	runInCleanedDatabase(userLoggedRoutesSuite);
});
