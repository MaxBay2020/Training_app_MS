import { Seeder, SeederFactoryManager } from 'typeorm-extension'
import { DataSource } from 'typeorm'
import Servicer from "../../entities/Servicer";

class ServicerMasterSeeder implements Seeder {
    // 实现Seeder接口中的run()方法
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        const repo = dataSource.getRepository(Servicer)

        const servicerMaster = Servicer.create({
            // id: '00001',
            id: '00003',
            servicerMasterName: 'Acme Mortgage'
        })

        await repo.insert([servicerMaster])
    }
}

export default ServicerMasterSeeder
