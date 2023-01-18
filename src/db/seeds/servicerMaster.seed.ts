import { Seeder, SeederFactoryManager } from 'typeorm-extension'
import { DataSource } from 'typeorm'
import ServicerMaster from "../../entities/ServicerMaster";

class ServicerMasterSeeder implements Seeder {
    // 实现Seeder接口中的run()方法
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        const repo = dataSource.getRepository(ServicerMaster)

        const servicerMaster = ServicerMaster.create({
            // id: '00001',
            id: '00003',
            servicerMasterName: 'Acme Mortgage'
        })

        await repo.insert([servicerMaster])
    }
}

export default ServicerMasterSeeder
