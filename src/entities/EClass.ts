import
{
    Entity,
    Column,
    PrimaryGeneratedColumn
}
    from 'typeorm'
import BaseClass from "./BaseClass";
import {MaxLength} from "class-validator";


@Entity('eClass')
class EClass extends BaseClass {
    @PrimaryGeneratedColumn('increment')
    id: string

    @Column()
    @MaxLength(100)
    eClassName: string
}

export default EClass
