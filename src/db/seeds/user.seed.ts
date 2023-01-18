import {Seeder, SeederFactoryManager} from 'typeorm-extension'
import {DataSource} from 'typeorm'
import User from "../../entities/User";
import {UserRoleEnum} from "../../enums/enums";
import ServicerMaster from "../../entities/ServicerMaster";
import UserRole from "../../entities/UserRole";

// 创建UserSeeder类，必须实现Seeder接口
class UserSeeder implements Seeder {
    // 实现Seeder接口中的run()方法
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        // 指定使用的是User这个entity
        const repo = dataSource.getRepository(User)

        // 插入假数据
        // 因为我们不需要创建很多的user，因此不需要user的factory类帮助我们创建
        // 我们采用手动创建的方式来创建少量的数据
        // 插入两个user，一个是admin，另一个是普通用户
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
