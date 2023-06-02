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


@Entity('user')
class User extends BaseClass {
    @PrimaryGeneratedColumn('increment')
    user_id: number

    @Column()
    @MaxLength(30)
    user_first_nm: string

    @Column()
    @MaxLength(30)
    user_last_nm: string

    @Column({
        unique: true
    })
    @IsEmail()
    @MaxLength(100)
    user_email_id: string

    @Column()
    @MaxLength(20)
    user_pwd: string

    @ManyToOne(() => UserRole, userRole => userRole.users)
    role: UserRole

    @ManyToOne(() => Servicer, servicerMaster => servicerMaster.users, {
        nullable: true
    })
    servicer: Servicer

    @OneToMany(() => Training, training => training.operated_by_user)
    operatedTrainings: Training[]

    @OneToMany(() => Training, training => training.reported_by_user)
    reportedTrainings: Training[]

    // @OneToMany(() => Training, training => training.updatedBy)
    // updatedTrainings: Training[]

}

export default User
