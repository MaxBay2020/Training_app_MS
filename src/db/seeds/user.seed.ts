import {Seeder, SeederFactoryManager} from 'typeorm-extension'
import {DataSource} from 'typeorm'
import User from "../../entities/User";
import {UserRoleEnum} from "../../enums/enums";
import ServicerMaster from "../../entities/ServicerMaster";
import UserRole from "../../entities/UserRole";

// insert fake records
class UserSeeder implements Seeder {

    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {

        const repo = dataSource.getRepository(User)


        const servicerMaster: ServicerMaster = await ServicerMaster.findOneBy({}) as ServicerMaster
        const userRoleServicer: UserRole = await UserRole.findOneBy({userRoleName: UserRoleEnum.SERVICER}) as UserRole
        const userRoleAdmin: UserRole = await UserRole.findOneBy({userRoleName: UserRoleEnum.ADMIN}) as UserRole
        const userRoleApprover: UserRole = await UserRole.findOneBy({userRoleName: UserRoleEnum.APPROVER}) as UserRole

        await repo.insert([
            {
                email: 'adam.smith@acme.com',
                firstName: "Adam",
                lastName: "Smith",
                servicer: servicerMaster,
                userRole: userRoleServicer
            },
            {
                email: "jane.doe@acme.com",
                firstName: "Jane",
                lastName: "Doe",
                servicer: servicerMaster,
                userRole: userRoleServicer
            },

            {
                email: 'max@hotmail.com',
                firstName: "Max",
                lastName: "Wong",
                servicer: servicerMaster,
                userRole: userRoleAdmin
            },
            {
                email: "lucy@hotmail.com",
                firstName: "Lucy",
                lastName: "Chen",
                userRole: userRoleApprover
            },
        ])
    }
}

export default UserSeeder
