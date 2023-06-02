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
import TrainingClass from "./TrainingClass";
import Training from "./Training";
import MandatoryTraining from "./MandatoryTraining";


@Entity('training_type_ref')
class TrainingType extends BaseClass {

    @PrimaryGeneratedColumn('increment')
    trng_typ_id: number

    @Column()
    @MaxLength(20)
    trng_typ_nm: string

    @Column()
    @MaxLength(255)
    trng_typ_desc: string

    @OneToMany(() => TrainingClass, traingClass => traingClass.trng_typ)
    trng_class: TrainingClass

    @OneToMany(() => Training, training => training.trng_type)
    training: Training[]

    @OneToMany(() => MandatoryTraining, mt => mt.trng_typ)
    mandatoryTraining: MandatoryTraining[]
}

export default TrainingType
