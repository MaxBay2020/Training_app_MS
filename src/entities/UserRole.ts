import
{
    Entity,
    BaseEntity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn, OneToMany, PrimaryColumn, ManyToMany, JoinTable
}
    from 'typeorm'
import User from "./User";
import BaseClass from "./BaseClass";
import {UserRoleEnum} from "../enums/enums";


@Entity('user_role')
class UserRole extends BaseClass {
    @PrimaryGeneratedColumn('increment')
    id: string

    @Column({
        nullable: true,
        default: UserRoleEnum.SERVICER
    })
    userRoleName: UserRoleEnum

    @ManyToMany(() => User, user => user.userRoles)
    @JoinTable()
    users: User[]
}

export default UserRole
