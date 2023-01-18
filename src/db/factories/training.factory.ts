import {setSeederFactory} from 'typeorm-extension'
import Training from "../../entities/Training";
import User from "../../entities/User";
import {TrainingTypeEnum, UserRoleEnum} from "../../enums/enums";

// 使用setSeederFactory(第一个参数， 第二个参数)方法来定义工厂流水线
// 第一个参数：指定要生产那个entity
// 第二个参数：是一个回调函数，用来创建entity；回调函数的形参faker就可以帮助我们生成假数据
export default setSeederFactory(Training, async faker => {

    const user: User = await User.findOneBy({}) as User

    const training = Training.create({
        trainingName: faker.company.name(),
        user,
        trainingType: TrainingTypeEnum.LiveTraining,
        startDate: new Date(Date.now()),
        endDate: new Date(Date.now()),
        hoursCount: 10,
        trainingURL: 'hello world'
    })

    return training
})
