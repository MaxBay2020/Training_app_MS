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
import {MaxLength} from "class-validator";


@Entity('servicer')
class Servicer extends BaseClass {
    @PrimaryColumn()
    servicer_id: string

    @Column()
    @MaxLength(50)
    servicer_nm: string

    @Column()
    @MaxLength(1)
    servicer_sts_cd: string

    @OneToMany(() => User, user => user.servicer)
    users: User[]

    @OneToMany(() => User, user => user.servicer)
    trainee: User[]

    @OneToMany(() => Training, training => training.servicer)
    trainings: Training[]
}

export default Servicer
