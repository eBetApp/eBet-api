// Construct a schema, using GraphQL schema language
import { gql } from 'apollo-server-express';

export const typeDefs = gql`
	type Query {
		signIn(nickname: String!, email: String!, password: String!): User!
		hello: String
	}
	type Mutation {
		signUp(nickname: String!, email: String!, password: String!): User
	}
	type User {
		uuid: String!
		nickname: String!
		email: String!
		password: String!
	}
`;
