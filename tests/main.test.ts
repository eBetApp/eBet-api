import runInCleanedDatabase from './utils/runInCleanedDatabase';
import { getSuite, authRoutesSuite, userLoggedRoutesSuite } from './suites';

describe('Tests to run sequentially in cleaned database', () => {
	runInCleanedDatabase(getSuite);
	runInCleanedDatabase(authRoutesSuite);
	runInCleanedDatabase(userLoggedRoutesSuite);
});
