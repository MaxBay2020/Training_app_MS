import
{
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne
}
    from 'typeorm'
import {TrainingStatusEnum} from "../enums/enums";
import User from "./User";
import BaseClass from "./BaseClass";


@Entity('training')
class Training extends BaseClass {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    trainingName: string

    @Column({
        nullable: true,
        default: TrainingStatusEnum.PENDING
    })
    trainingStatus: TrainingStatusEnum

    @ManyToOne(()=>User, user => user.trainings)
    user: User

    @Column({
        nullable: true
    })
    operatedBy: string

    @Column({
        nullable: true
    })
    operatedAt: Date
}

export default Training
