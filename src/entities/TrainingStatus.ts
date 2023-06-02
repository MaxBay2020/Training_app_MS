import
{
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne, OneToMany
}
    from 'typeorm'
import {TrainingStatusEnum, TrainingTypeEnum} from "../enums/enums";
import User from "./User";
import BaseClass from "./BaseClass";
import {IsInt, MaxLength} from "class-validator";
import Servicer from "./Servicer";
import Trainee from "./Trainee";
import TrainingType from "./TrainingType";
import Training from "./Training";
import MandatoryTraining from "./MandatoryTraining";


@Entity('training_status_ref')
class TrainingStatus extends BaseClass {

    @PrimaryGeneratedColumn('increment')
    trng_sts_cd: number

    @Column()
    @MaxLength(20)
    trng_sts_nm: string

    @Column()
    @MaxLength(255)
    trng_sts_desc: string


    @OneToMany(() => Training, training => training.trng_sts_cd)
    training: Training[]

    @OneToMany(() => MandatoryTraining, mt => mt.trng_class)
    mandatoryTraining: MandatoryTraining[]
}

export default TrainingStatus
