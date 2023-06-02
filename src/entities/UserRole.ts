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
import {UserRoleEnum} from "../enums/enums";
import {MaxLength} from "class-validator";


@Entity('role_ref')
class UserRole extends BaseClass {
    @PrimaryGeneratedColumn('increment')
    role_id: number

    @Column({
        type: 'enum',
        enum: UserRoleEnum,
        nullable: true,
        default: UserRoleEnum.SERVICER
    })
    role_nm: UserRoleEnum

    @Column()
    @MaxLength(255)
    role_desc: string

    @OneToMany(() => User, user => user.role)
    users: User[]
}

export default UserRole
