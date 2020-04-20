/* eslint-disable @typescript-eslint/no-use-before-define */ // TOD -> à mettre en global
// import fs from 'fs';
// import path from 'path';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
// import { getRepository, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import passport from 'passport';
import { User } from '../entity/User';
import { SendMail, Mail } from './mailGunService';
import { addUserRepository } from '../repositories/userRepository';

interface BaseResult {
	status: number;
}

export interface SuccesResult extends BaseResult {
	data: {
		user: User;
	};
	meta: {
		token: string;
	};
}

export interface ErrorResult extends BaseResult {
	err: any;
}

type Result = SuccesResult | ErrorResult;
export const signupService = async (
	nickname: string,
	password: string,
	email: string,
	birthDate: Date
): Promise<Result> => {
	const user: User = new User();
	user.nickname = nickname;
	user.password = password;
	user.email = email;
	user.birthDate = birthDate;

	let res: SuccesResult;
	let err: ErrorResult;

	const errors: ValidationError[] = await validate(user);

	if (errors.length > 0) {
		err = {
			status: 400,
			err: errors,
		};
	}

	user.hashPassword();

	try {
		const insertedUser = await addUserRepository(user);
		console.log('User created');
		console.log(insertedUser);
		const data: Mail = {
			from: 'E-bet corporation <ebetcorporation@ebetcorporation.org>',
			to: insertedUser.email,
			subject: 'Subscription',
			text: `Congratulations ${insertedUser.nickname}, you are now registered to E-bet!`,
		};

		SendMail(data);

		const token: string = setToken(insertedUser);

		res = {
			status: 201,
			data: { user: insertedUser },
			meta: { token },
		};
	} catch (error) {
		err = {
			status: 400,
			err: error.message,
		};
	}

	return new Promise(
		(
			resolve: (result: SuccesResult) => void,
			reject: (result: ErrorResult) => void,
		) => {
			if (err) reject(err);
			else {
				resolve(res);
			}
		},
	);
};

export const signinService = async (req: Request, res: Response
): Promise<Result> => {
	let res2: SuccesResult;
	let err: ErrorResult;
	return new Promise(
		(
			resolve: (result: SuccesResult) => void,
			reject: (result: ErrorResult) => void,
		) => {
			passport.authenticate('local', { session: false }, async (error, user) => {
				if (!error) {
					const token: string = setToken(user);
					res2 = {
						status: 201,
						data: { user },
						meta: { token },
					};
					resolve(res2);
				} else {
					err = {
						status: 400,
						err: error.message,
					};
					reject(err);
				}
			})(req, res);
		}
	);
};

export const setToken = (user: User): string => {
	const { uuid, nickname, email, birthDate } = user;
	const payload = { uuid, nickname, email, birthDate };
	const token: string = jwt.sign(payload, process.env.SECRET as string);
	return token;
};
