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


@Entity('servicer master')
class ServicerMaster extends BaseClass {
    @PrimaryColumn()
    id: string

    @Column()
    servicerMasterName: string

    @OneToMany(() => User, user => user.servicer)
    users: User[]
}

export default ServicerMaster
