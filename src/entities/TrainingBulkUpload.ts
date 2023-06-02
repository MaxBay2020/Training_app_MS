// import
// {
//     Entity,
//     Column,
//     PrimaryGeneratedColumn,
//     ManyToOne
// }
//     from 'typeorm'
// import {TrainingStatusEnum, TrainingTypeEnum} from "../enums/enums";
// import User from "./User";
// import BaseClass from "./BaseClass";
// import {IsInt, MaxLength} from "class-validator";
// import Servicer from "./Servicer";
// import Trainee from "./Trainee";
// import TrainingType from "./TrainingType";
// import TrainingClass from "./TrainingClass";
// import TrainingStatus from "./TrainingStatus";
// import UploadStatus from "./UploadStatus";
//
//
// @Entity('training_bulk_upload')
// class TrainingBulkUpload extends BaseClass {
//
//     @PrimaryGeneratedColumn('increment')
//     fiscal_year: number
//
//     @Column()
//     @MaxLength(20)
//     trnee_first_nm: string
//
//     @Column()
//     @MaxLength(18)
//     trnee_last_nm: string
//
//     @Column()
//     trng_start_dt: Date
//
//     @Column()
//     trng_end_dt: Date
//
//     @Column()
//     trng_credit_hrs: number
//
//     @Column()
//     @MaxLength(20)
//     trng_type: string
//
//     @Column()
//     @MaxLength(20)
//     trng_nm: string
//
//     @Column()
//     @MaxLength(18)
//     trng_url: string
//
//     @Column()
//     @MaxLength(18)
//     eclass_trng_nm: string
//
//     @Column()
//     @MaxLength(255)
//     upload_sts_cmnt: string
//
//     @ManyToOne(() => UploadStatus, us => us.trainingBulkUpload)
//     upload_sts_cd: UploadStatus
// }
//
// export default TrainingBulkUpload
