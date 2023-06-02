import {BaseEntity, Column, CreateDateColumn, UpdateDateColumn} from "typeorm";

class BaseClass extends BaseEntity {
    @CreateDateColumn()
    first_create_dt: Date

    @UpdateDateColumn()
    last_update_dt: Date
}

export default BaseClass
