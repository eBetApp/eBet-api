import { AuthenticationError } from 'apollo-server-errors';
import {
	signupService,
	SuccesResult,
	ErrorResult,
} from '../services/userAuthServices';
import { User } from '../entity/User';

interface UserToRegister {
	nickname: string;
	password: string;
	email: string;
	birthDate: Date;
}

// Provide resolver functions for your schema fields
export const resolvers = {
	Query: {
		hello: () => 'Hello world!',
	},
	Mutation: {
		signUp: async (
			parent: any,
			args: UserToRegister,
		): Promise<User | undefined> => {
			const { nickname, password, email, birthDate } = args;
			try {
				const result = await signupService(nickname, password, email, birthDate);
				return (result as SuccesResult).data.user;
			} catch (error) {
				throw new AuthenticationError((error as ErrorResult).err);
			}
		},
	},
};
