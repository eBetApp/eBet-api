/* eslint-disable @typescript-eslint/no-use-before-define */ // TOD -> à mettre en global
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getRepository, Repository } from 'typeorm';
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
): Promise<Result> => {
	const user: User = new User();
	user.nickname = nickname;
	user.password = password;
	user.email = email;

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
			from: 'My S3 company <myS3Company@myS3Company.org>',
			to: insertedUser.email,
			subject: 'Subscription',
			text: `Congratulations ${insertedUser.nickname}, you are now registered to MyS3!`,
		};

		SendMail(data);

		const userPath: string = path.join(
			__dirname,
			'../../myS3DATA',
			insertedUser.uuid.toString(),
		);
		console.log(userPath);
		if (!fs.existsSync(userPath)) {
			fs.mkdir(userPath, () => {
				console.log('bucke created');
			});
			// fs.mkdir(userPath, {recursive: true}, err => {})
		}

		const payload = { id: insertedUser.uuid, nickname, email };
		const token: string = jwt.sign(payload, process.env.SECRET as string);

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

export const signin = async (
	req: Request,
	res: Response,
): Promise<Response | void> => {
	console.log('#SIGN IN');

	passport.authenticate(
		'local',
		{ session: false },
		async (err, user: User) => {
			if (err) {
				res.status(400).json({
					error: { message: err },
				});
				return res.status(400);
			}

			const token: string = setToken(user);

			res.status(200).json({ data: { user }, meta: { token } });
		},
	)(req, res);
};

export const setToken = (user: User): string => {
	const { uuid, nickname, email } = user;
	const payload = { uuid, nickname, email };
	const token: string = jwt.sign(payload, process.env.SECRET as string);
	return token;
};
