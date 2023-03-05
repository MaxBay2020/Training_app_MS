import
{
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne
}
    from 'typeorm'
import {TrainingStatusEnum, TrainingTypeEnum} from "../enums/enums";
import User from "./User";
import BaseClass from "./BaseClass";
import {IsInt, MaxLength} from "class-validator";
import ServicerMaster from "./ServicerMaster";


@Entity('training')
class Training extends BaseClass {
    @PrimaryGeneratedColumn('increment')
    id: string

    @Column()
    @MaxLength(100)
    trainingName: string

    @Column({
        type: 'enum',
        enum: TrainingStatusEnum,
        nullable: true,
        default: TrainingStatusEnum.PENDING
    })
    trainingStatus: TrainingStatusEnum

    @ManyToOne(()=>User, user => user.trainings)
    user: User

    @ManyToOne(()=>ServicerMaster, servicerMaster => servicerMaster.trainings)
    servicerMaster: ServicerMaster

    @ManyToOne(()=>User, user => user.operatedTrainings)
    operatedBy: User

    @Column({
        nullable: true
    })
    operatedAt: Date

    @Column({
        nullable: true,
    })
    note: string

    @Column({
        type: 'enum',
        enum: TrainingTypeEnum
    })
    trainingType: TrainingTypeEnum

    @Column()
    startDate: Date

    @Column()
    endDate: Date

    @Column()
    @IsInt()
    hoursCount: number

    @Column({
        nullable: true,
    })
    @MaxLength(100)
    trainingURL: string

}

export default Training
