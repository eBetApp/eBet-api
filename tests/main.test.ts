import app from '../src/app';
import supertest from 'supertest';
import { createConnection, Connection } from 'typeorm';
import * as PostgressConnectionStringParser from 'pg-connection-string';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { User } from '../src/entity/User';
import AuthController from '../src/controllers/AuthController';
import request from 'superagent';
require('dotenv').config();

const server: supertest.SuperTest<supertest.Test> = supertest(app);

let connection: Connection;

beforeAll(async done => {
	// Step 01: Database connection
	let typeOrmOptions: PostgresConnectionOptions;

	if (process.env.DB_TEST_URL == null)
		throw new Error('DB_TEST_URL is required in .env file');

	const databaseUrl: string = <string>process.env.DB_TEST_URL;

	const connectionOptions = PostgressConnectionStringParser.parse(
		databaseUrl,
	);
	typeOrmOptions = {
		type: 'postgres',
		host: connectionOptions.host as string,
		port:
			connectionOptions.port == null
				? 5432
				: (Number.parseInt(connectionOptions.port) as number),
		username: connectionOptions.user as string,
		password: connectionOptions.password as string,
		database: connectionOptions.database as string,
		synchronize: true,
		logging: false,
		entities: [User],
		extra: {
			ssl: process.env.DB_TEST_SSL === 'true' ? true : false,
		},
	};

	connection = await createConnection(typeOrmOptions);

	// Step 02: Drop database
	await connection.dropDatabase();
	await connection.close();

	// Step 03: ReOpen Database
	connection = await createConnection(typeOrmOptions);
	done();
});

describe('Get', () => {
	it('simple get home', async done => {
		const res: request.Response = await server.get('/');
		expect(res.status).toBe(200);
		done();
	});
});

describe('Auth routes', () => {
	const userWithCorrectData: User = new User();
	userWithCorrectData.nickname = 'Bob';
	userWithCorrectData.password = 'bob1';
	userWithCorrectData.email = 'bob@gmail.com';

	describe('Sign Up routes / Local PASSPORT strategy', () => {
		it('Sign Up with correct data should return 201', async done => {
			const res: request.Response = await server
				.post('/api/auth/signup')
				.send(userWithCorrectData);
			expect(res.status).toBe(201);
			done();
		});
		it('Sign Up with an already used nickname should return 400', async done => {
			const userWithAlreadyUsedNickname: User = userWithCorrectData;
			const res = await server
				.post('/api/auth/signup')
				.send(userWithAlreadyUsedNickname);
			expect(res.status).toBe(400);
			done();
		});
		it('Sign Up with too short password should return 400', async done => {
			const userWIthTooShortPwd: User = new User();
			userWIthTooShortPwd.nickname = 'Bob';
			userWIthTooShortPwd.password = 'bob';
			userWIthTooShortPwd.email = 'bob@gmail.com';

			const res: request.Response = await server
				.post('/api/auth/signup')
				.send(userWIthTooShortPwd);
			expect(res.status).toBe(400);
			done();
		});
		it('Sign Up with unformatted mail should return 400', async done => {
			const userWIthTooShortPwd: User = new User();
			userWIthTooShortPwd.nickname = 'Bob1';
			userWIthTooShortPwd.password = 'bob1';
			userWIthTooShortPwd.email = 'bob@gmail';

			const res: request.Response = await server
				.post('/api/auth/signup')
				.send(userWIthTooShortPwd);
			expect(res.status).toBe(400);
			done();
		});
	});

	describe('Sign In routes', () => {
		it('Sign In with correct data should return 200', async done => {
			const res: request.Response = await server
				.post('/api/auth/signin')
				.send(userWithCorrectData);
			expect(res.status).toBe(200);
			done();
		});
		it('Sign In with unexisting user should return 400', async done => {
			console.log('### SIGNIN BAD1');
			const userNotCreated: User = new User();
			userNotCreated.nickname = 'unexists';
			userNotCreated.password = 'unexists';
			userNotCreated.email = 'unexists@gmail.com';

			const res: request.Response = await server
				.post('/api/auth/signin')
				.send(userNotCreated);
			expect(res.status).toBe(400);
			done();
		});
		it('Sign In with wrong password should return 400', async done => {
			console.log('### SIGNIN BAD2');
			const userNotCreated: User = new User();
			userNotCreated.nickname = 'Bob';
			userNotCreated.password = 'wrongPassword';
			userNotCreated.email = 'bob@gmail.com';

			const res: request.Response = await server
				.post('/api/auth/signin')
				.send(userNotCreated);
			expect(res.status).toBe(400);
			done();
		});
	});

	describe('PASSPORT JWT strategy', () => {
		// Step 1 : Define a weel formatted JsonWebToken, but with false data
		const fictiveUser: User = new User();
		fictiveUser.nickname = 'fictive';
		fictiveUser.password = 'fictive';
		fictiveUser.email = 'fictive@gmail.com';

		const unexistingJWT = AuthController.setToken(fictiveUser);

		// Step 3 : Run test to auth with unformatted token
		it('Should return 401 if given token is incorrectly formatted', async done => {
			const resWithTrueUuid: request.Response = await server
				.get('/api/user/')
				.set('Accept', 'application/json')
				.set('Authorization', `Bearer incorrectToken`);
			expect(resWithTrueUuid.status).toBe(401);
			done();
		});

		// Step 3 : Run test to auth with this unexisting but well formatted token
		it('Should return 500 if given token is well formatted but does not exist - uuid does not matter', async done => {
			const resWithTrueUuid: request.Response = await server
				.get('/api/user/')
				.set('Accept', 'application/json')
				.set('Authorization', `Bearer ${unexistingJWT}`); // user1 is already deleted
			expect(resWithTrueUuid.status).toBe(500);
			done();
		});
	});
});

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
				.get(`/api/user/1234`)
				.set('Accept', 'application/json')
				.set('Authorization', `Bearer ${userToBeDeletedToken}`);
			expect(res.status).toBe(401);
			done();
		});
		it('Should return 401 if bad token and bad uuid are given', async done => {
			const res: request.Response = await server
				.get(`/api/user/1234`)
				.set('Accept', 'application/json')
				.set('Authorization', `Bearer falseToken`);
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

afterAll(async done => {
	await connection.close();
	done();
});
