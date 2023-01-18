import { Seeder, SeederFactoryManager } from 'typeorm-extension'
import { DataSource } from 'typeorm'
import {UserRoleEnum} from "../../enums/enums";
import UserRole from "../../entities/UserRole";

class UserRoleSeeder implements Seeder {
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        const repo = dataSource.getRepository(UserRole)


        await repo.insert([
            {
                id: '1',
                userRoleName: UserRoleEnum.SERVICER
            },
            {
                id: '2',
                userRoleName: UserRoleEnum.APPROVER
            },
            {
                id: '3',
                userRoleName: UserRoleEnum.ADMIN
            }
        ])
    }
}

export default UserRoleSeeder
