// import
// {
//     Entity,
//     Column,
//     PrimaryGeneratedColumn,
//     ManyToOne, OneToMany, OneToOne
// }
//     from 'typeorm'
// import {TrainingStatusEnum, TrainingTypeEnum} from "../enums/enums";
// import User from "./User";
// import BaseClass from "./BaseClass";
// import {IsInt, MaxLength} from "class-validator";
// import Servicer from "./Servicer";
// import Trainee from "./Trainee";
// import TrainingType from "./TrainingType";
// import Training from "./Training";
// import MandatoryTraining from "./MandatoryTraining";
// import TrainingBulkUpload from "./TrainingBulkUpload";
//
//
// @Entity('upload_status_ref')
// class UploadStatus extends BaseClass {
//
//     @PrimaryGeneratedColumn('increment')
//     upload_sts_cd: number
//
//     @Column()
//     @MaxLength(20)
//     upload_sts_nm: string
//
//     @Column()
//     @MaxLength(255)
//     upload_sts_desc: string
//
//     @OneToOne(() => TrainingBulkUpload, tbu => tbu.upload_sts_cd)
//     trainingBulkUpload: TrainingBulkUpload[]
// }
//
// export default UploadStatus
