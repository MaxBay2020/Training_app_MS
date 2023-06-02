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


@Entity('training_class')
class TrainingClass extends BaseClass {

    @PrimaryGeneratedColumn('increment')
    trng_class_id: number

    @Column()
    @MaxLength(20)
    trng_class_nm: string

    @Column()
    @MaxLength(255)
    trng_class_desc: string

    @Column()
    @MaxLength(20)
    trng_class_url: string

    @ManyToOne(() => TrainingType, trainingType => trainingType.trng_class)
    trng_typ: TrainingType

    @OneToMany(() => Training, training => training.trng_class)
    training: Training[]

    @OneToMany(() => MandatoryTraining, mt => mt.trng_class)
    mandatoryTraining: MandatoryTraining[]
}

export default TrainingClass
