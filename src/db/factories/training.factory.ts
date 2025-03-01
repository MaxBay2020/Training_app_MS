import {setSeederFactory} from 'typeorm-extension'
import Training from "../../entities/Training";
import User from "../../entities/User";
import {TrainingTypeEnum, UserRoleEnum} from "../../enums/enums";

/**
 * insert bulk records for training table
 */
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
