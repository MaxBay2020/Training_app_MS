import
{
    Entity,
    BaseEntity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne, PrimaryColumn, OneToMany
}
    from 'typeorm'
import {UserRoleEnum} from "../enums/enums";
import ServicerMaster from "./ServicerMaster";
import Training from "./Training";
import BaseClass from "./BaseClass";
import {IsEmail} from "class-validator";


@Entity('user')
class User extends BaseClass {
    @PrimaryColumn()
    @IsEmail()
    email: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({
        nullable: true,
        default: UserRoleEnum.SERVICER
    })
    userRole: UserRoleEnum

    @ManyToOne(()=>ServicerMaster,
            servicerMaster => servicerMaster.users,
        {
        nullable: true
        })
    servicer: ServicerMaster

    @OneToMany(() => Training, training => training.user)
    trainings: Training[]
}

export default User
