import supertest from 'supertest';
import request from 'superagent';
import { User } from '../../src/entity/User';

const userLoggedRoutesSuite = (server: supertest.SuperTest<supertest.Test>) =>
	describe('User routes', () => {
		// Create users to test user's routes
		const userToBeDeleted: User = new User();
		userToBeDeleted.nickname = 'Bob1';
		userToBeDeleted.password = 'bob1';
		userToBeDeleted.email = 'bob1@gmail.com';

		const permanentUser: User = new User();
		permanentUser.nickname = 'Bob2';
		permanentUser.password = 'bob2';
		permanentUser.email = 'bob2@gmail.com';

		let userToBeDeletedToken: string, permanentUserToken: string;
		let userToBeDeletedUuid: string, permanentUserUuid: string;

		it('Should create 3 users for next tests', async done => {
			const res1: request.Response = await server
				.post('/api/auth/signup')
				.send(userToBeDeleted);
			userToBeDeletedToken = res1.body.meta.token;
			userToBeDeletedUuid = res1.body.data.user.uuid;

			const res2: request.Response = await server
				.post('/api/auth/signup')
				.send(permanentUser);
			permanentUserToken = res2.body.meta.token;
			permanentUserUuid = res2.body.data.user.uuid;

			expect(res1.status).toBe(201);
			expect(res2.status).toBe(201);
			done();
		});

		describe('ALL route', () => {
			it('Should return of all users if existing token is given', async done => {
				const res: request.Response = await server
					.get('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${userToBeDeletedToken}`);
				expect(res.status).toBe(200);
				done();
			});
			it('Should return 401 if false token is given', async done => {
				const res: request.Response = await server
					.get('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', 'Bearer falseToken');
				expect(res.status).toBe(401);
				done();
			});
			it('Should return 401 of all users if token is not given', async done => {
				const res: request.Response = await server.get('/api/user/');
				expect(res.status).toBe(401);
				done();
			});
		});

		describe('ONE route', () => {
			it('Should return 200 if existing token and uuid are given', async done => {
				const res: request.Response = await server
					.get(`/api/user/${userToBeDeletedUuid}`)
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${userToBeDeletedToken}`);
				expect(res.status).toBe(200);
				done();
			});
			it('Should return 401 if existing token and bad uuid are given', async done => {
				const res: request.Response = await server
					.get('/api/user/1234')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${userToBeDeletedToken}`);
				expect(res.status).toBe(401);
				done();
			});
			it('Should return 401 if bad token and bad uuid are given', async done => {
				const res: request.Response = await server
					.get('/api/user/1234')
					.set('Accept', 'application/json')
					.set('Authorization', 'Bearer falseToken');
				expect(res.status).toBe(401);
				done();
			});
		});

		describe('DELETE route', () => {
			it('Should return 200 with existing token and uuid', async done => {
				const res: request.Response = await server
					.delete(`/api/user/${userToBeDeletedUuid}`)
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${userToBeDeletedToken}`);
				expect(res.status).toBe(200);
				done();
			});
			it('Should return 404 with existing token but not existing uuid', async done => {
				const res: request.Response = await server
					.delete(`/api/user/${userToBeDeletedUuid}`) // user1 is already deleted
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`);
				expect(res.status).toBe(404);
				done();
			});
			it('Should return 500 if deleted token but existing uuid', async done => {
				const res: request.Response = await server
					.delete(`/api/user/${permanentUserUuid}`)
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${userToBeDeletedToken}`);
				expect(res.status).toBe(500);
				done();
			});
		});

		describe('UPDATE route', () => {
			it('Should return 200 if correct token - uuid - nickname - email', async done => {
				const res: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						id: permanentUserUuid,
						nickname: 'newNickname',
						email: 'new@gmail.com',
					});
				expect(res.status).toBe(200);
				done();
			});

			it('Should return 400 if correct token - uuid BUT empty nickname', async done => {
				const res: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						id: permanentUserUuid,
						nickname: '', // incorrect
						email: 'new@gmail.com',
					});
				expect(res.status).toBe(400);
				done();
			});

			it('Should return 400 if correct token - uuid BUT incorrect email', async done => {
				const res: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						id: permanentUserUuid,
						nickname: 'newNickname',
						email: 'new@gmail', // incorrect
					});
				expect(res.status).toBe(400);
				done();
			});

			it('Should return 400 if correct token - uuid BUT incorrect nickname AND email', async done => {
				const res: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						id: permanentUserUuid,
						nickname: '', // incorrect
						email: 'new@gmail', // incorrect
					});
				expect(res.status).toBe(400);
				done();
			});

			it('Should return 400 if correct token - uuid BUT incomplete data (nickname or email)', async done => {
				const resWithNoNickname: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						id: permanentUserUuid,
						email: 'new@gmail.com',
						// no nickname but required
					});
				const resWithNoEmail: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						id: permanentUserUuid,
						email: 'new@gmail.com',
						// no nickname but required
					});
				expect(resWithNoNickname.status).toBe(400);
				expect(resWithNoEmail.status).toBe(400);
				done();
			});

			it('Should return 400 if correct token BUT no UUID and incomplete data (nickname or email)', async done => {
				const resWithNoNickname: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						// no ID
						email: 'new@gmail.com',
						// no nickname but required
					});
				const resWithNoEmail: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						// no ID
						email: 'new@gmail.com',
						// no nickname but required
					});
				expect(resWithNoNickname.status).toBe(400);
				expect(resWithNoEmail.status).toBe(400);
				done();
			});

			it('Should return 500 if correct token BUT no UUID', async done => {
				const res: request.Response = await server
					.put('/api/user/')
					.set('Accept', 'application/json')
					.set('Authorization', `Bearer ${permanentUserToken}`)
					.send({
						// no ID
						nickname: 'newNickname', // incorrect
						email: 'new@gmail.com', // incorrect
					});
				expect(res.status).toBe(500);
				done();
			});
		});
	});

export default userLoggedRoutesSuite;
