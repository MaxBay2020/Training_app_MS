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


@Entity('user role')
class UserRole extends BaseClass {
    @PrimaryGeneratedColumn('increment')
    id: string

    @Column({
        nullable: true,
        default: UserRoleEnum.SERVICER
    })
    userRoleName: UserRoleEnum

    @OneToMany(() => User, user => user.userRole)
    users: User[]
}

export default UserRole
