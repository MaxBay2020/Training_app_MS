import {BaseEntity, Column, CreateDateColumn, UpdateDateColumn} from "typeorm";

class BaseClass extends BaseEntity {
    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({
        nullable: true,
        default: true
    })
    isActive: boolean

    @Column({
        nullable: true,
        default: false
    })
    isDelete: boolean
}

export default BaseClass
