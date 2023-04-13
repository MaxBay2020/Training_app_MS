import
{
    Entity,
    BaseEntity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne, PrimaryColumn, OneToMany, PrimaryGeneratedColumn, ManyToMany, JoinTable
}
    from 'typeorm'
import {UserRoleEnum} from "../enums/enums";
import ServicerMaster from "./ServicerMaster";
import Training from "./Training";
import BaseClass from "./BaseClass";
import {IsEmail} from "class-validator";
import UserRole from "./UserRole";


@Entity('user')
class User extends BaseClass {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        unique: true
    })
    @IsEmail()
    email: string

    @Column()
    password: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @ManyToMany(() => UserRole, userRole => userRole.users)
    userRoles: UserRole[]

    @ManyToOne(()=>ServicerMaster,
            servicerMaster => servicerMaster.users,
        {
        nullable: true
        })
    servicer: ServicerMaster

    @OneToMany(() => Training, training => training.user)
    trainings: Training[]

    @OneToMany(() => Training, training => training.operatedBy)
    operatedTrainings: Training[]

}

export default User
