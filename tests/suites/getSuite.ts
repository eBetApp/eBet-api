import supertest from 'supertest';
import request from 'superagent';

const getSuite = (server: supertest.SuperTest<supertest.Test>) =>
	describe('Get', () => {
		it('simple get home', async done => {
			const res: request.Response = await server.get('/');
			expect(res.status).toBe(200);
			done();
		});
		it('GRAPHQL_simple return hello', async done => {
			const res: request.Response = await server
				.post('/graphql')
				.set('Accept', 'application/json')
				.send({
					query: `
      query {
        hello
      }
      `,
				});
			expect(res.status).toBe(200);
			done();
		});
	});

export default getSuite;
