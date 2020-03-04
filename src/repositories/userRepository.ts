import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/User';

export async function addUserRepository(user: User): Promise<User> {
	const userRepository: Repository<User> = getRepository(User);
	return await userRepository.save(user);
}
