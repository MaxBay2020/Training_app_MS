import
{
    Entity,
    BaseEntity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn, OneToMany, PrimaryColumn
}
    from 'typeorm'
import User from "./User";
import BaseClass from "./BaseClass";
import Training from "./Training";
import {IsBoolean} from "class-validator";


@Entity('servicer_master')
class ServicerMaster extends BaseClass {
    @PrimaryColumn()
    id: string

    @Column()
    servicerMasterName: string

    @Column({
        default: false
    })
    @IsBoolean()
    trsiiOptIn: boolean

    @Column({
        default: false
    })
    @IsBoolean()
    optOutFlag: boolean


    @OneToMany(() => User, user => user.servicer)
    users: User[]

    @OneToMany(() => Training, training => training.servicerMaster)
    trainings: Training[]
}

export default ServicerMaster
