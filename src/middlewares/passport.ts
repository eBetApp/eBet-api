import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { getRepository, Repository } from "typeorm";
import { User } from "../entity/User";
require("dotenv").config();

passport.use(
	new LocalStrategy(
		{
			usernameField: "nickname",
			passwordField: "password",
		},
		async (username, password, next) => {
			console.log("LOCAL strategy");
			try {
				const userRepository: Repository<User> = getRepository(User);
				const user: User | undefined = await userRepository.findOne({
					nickname: username,
				});

				if (!user) throw new Error("User doesn't exist"); // status 400

				if (!user.checkIfUnencryptedPasswordIsValid(password)) {
					throw new Error("Password doesn't match"); // status 400
				}
				return next(false, user);
			} catch (err) {
				return next(err.message); // status 500
			}
		},
	),
);

passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // return 401 if format is not token
			secretOrKey: process.env.SECRET as string,
		},
		async (jwtPayload, next) => {
			console.log("JWT strategy");
			console.log("jwtPayload:");
			console.log(jwtPayload);
			try {
				const userRepository: Repository<User> = getRepository(User);
				const user: User | undefined = await userRepository.findOne({
					uuid: jwtPayload.id,
				});

				if (!user) throw new Error("user not found");

				return next(false, user);
			} catch (err) {
				return next(err.message); // status 500
			}
		},
	),
);
