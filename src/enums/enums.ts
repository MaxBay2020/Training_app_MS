export enum TrainingStatusEnum {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUBMITTED = 'SUBMITTED',
    CANCELED = 'CANCELED',
}


export enum UserRoleEnum {
    ADMIN = 'ADMIN',
    APPROVER = 'APPROVER',
    SERVICER = 'SERVICER',
    SERVICER_COORDINATOR = 'SERVICER COORDINATOR',
}

export enum TrainingTypeEnum {
    LiveTraining = 'LiveTraining',
    ECLASS = 'ECLASS',
    Webinar = 'Webinar'
}

export enum fiscalEndDate {
    month = 9,
    date = 30
}

export enum trainingScore {
    LiveTraining = '0.5%',
    EClass = '0.5%',
    Webinar = '0.2%'
}


export enum targetTableToDownload {
    trainingTable = 'trainingTable',
    creditTable = 'creditTable'
}

export enum aiStyle {
    dbRelated = 'You are an intelligent assistant. The user will provide queried database information. First, compress the data by removing duplicates and irrelevant content, extract key information, and then answer the user\'s questions concisely and accurately. Do not fabricate information.'
}



