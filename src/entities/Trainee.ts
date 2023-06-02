import
{
    Entity,
    BaseEntity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne, PrimaryColumn, OneToMany, PrimaryGeneratedColumn
}
    from 'typeorm'
import {UserRoleEnum} from "../enums/enums";
import Servicer from "./Servicer";
import Training from "./Training";
import BaseClass from "./BaseClass";
import {IsEmail, MaxLength} from "class-validator";
import UserRole from "./UserRole";


@Entity('trainee')
class Trainee extends BaseClass {
    @PrimaryGeneratedColumn('increment')
    trnee_id: number

    @Column()
    @MaxLength(30)
    trnee_first_nm: string

    @Column()
    @MaxLength(30)
    trnee_last_nm: string

    @Column({
        unique: true
    })
    @IsEmail()
    @MaxLength(100)
    trnee_email_id: string

    @ManyToOne(() => Servicer, servicer => servicer.trainee)
    servicer: Servicer

    @OneToMany(() => Training, training => training.trainee)
    trainings: Training[]

}

export default Trainee
