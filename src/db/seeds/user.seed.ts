import { Seeder, SeederFactoryManager } from 'typeorm-extension'
import { DataSource } from 'typeorm'
import User from "../../entities/User";
import {UserRoleEnum} from "../../enums/enums";
import ServicerMaster from "../../entities/ServicerMaster";

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

        await repo.insert([
            // {
            //     email: 'max@gmail.com',
            //     firstName: "Max",
            //     lastName: "Wong",
            //     servicer: servicerMaster,
            //     userRole: UserRoleEnum.SERVICER
            // },
            // {
            //     email: "lucy@lucy.com",
            //     firstName: "Lucy",
            //     lastName: "Chen",
            //     userRole: UserRoleEnum.ADMIN
            // },

            {
                email: 'max@hotmail.com',
                firstName: "Max",
                lastName: "Wong",
                servicer: servicerMaster,
                userRole: UserRoleEnum.SERVICER
            },
            {
                email: "lucy@hotmail.com",
                firstName: "Lucy",
                lastName: "Chen",
                userRole: UserRoleEnum.ADMIN
            },
        ])
    }
}

export default UserSeeder
