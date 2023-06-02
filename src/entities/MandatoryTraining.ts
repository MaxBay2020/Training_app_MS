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
import TrainingClass from "./TrainingClass";


@Entity('mandatory_training')
class MandatoryTraining extends BaseClass {

    @PrimaryGeneratedColumn('increment')
    fiscal_year: number

    @Column()
    @MaxLength(255)
    mand_trng_note: string

    @ManyToOne(() => TrainingType, trainingType => trainingType.mandatoryTraining)
    trng_typ: TrainingType

    @ManyToOne(() => TrainingClass, trainingClass => trainingClass.mandatoryTraining)
    trng_class: TrainingClass
}

export default MandatoryTraining
