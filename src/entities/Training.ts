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
import Servicer from "./Servicer";
import Trainee from "./Trainee";
import TrainingType from "./TrainingType";
import TrainingClass from "./TrainingClass";
import TrainingStatus from "./TrainingStatus";


@Entity('training')
class Training extends BaseClass {
    @Column()
    fiscal_year: number

    @PrimaryGeneratedColumn('increment')
    trng_sqnc_nbr: number

    @Column()
    trng_dt: Date

    @Column()
    @IsInt()
    trng_credit_hrs: number

    @Column()
    @MaxLength(255)
    live_trng_class_nm: string

    @Column({
        nullable: true,
        default: ''
    })
    @MaxLength(255)
    live_trng_class_url: string

    @Column({
        nullable: true,
        default: ''
    })
    @MaxLength(255)
    trng_cmnt: string

    @ManyToOne(() => Trainee, trainee => trainee.trainings)
    trainee: Trainee

    @ManyToOne(() => Servicer, servicer => servicer.trainings)
    servicer: Servicer

    @ManyToOne(() => TrainingType, trainingType => trainingType.training)
    trng_type: TrainingType

    @ManyToOne(() => TrainingClass, trainingClass => trainingClass.training)
    trng_class: TrainingClass

    @ManyToOne(() => TrainingStatus, trainingClass => trainingClass.training)
    trng_sts_cd: TrainingStatus

    @ManyToOne(() => User, user => user.reportedTrainings)
    reported_by_user: User

    @ManyToOne(() => User, user => user.operatedTrainings)
    operated_by_user: User



    // @ManyToOne(() => User, user => user.updatedTrainings)
    // updatedBy: User

}

export default Training
