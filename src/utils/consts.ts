export const access_token_expiresIn = '30m'
export const saltRounds = 10
export const maxCredits = 0.01
export const eClassModuleCount = 7
export const logoUrl = 'src/asset/img/logo.png'


export type TableHeadLabelType = {
    // for training table
    'Training Name': string,
    'Training Type': string,
    'Trainee Email': string,
    'Trainee Name': string,
    'Start Date': string,
    'End Date': string,
    'Hours': string,
    'Training Status': string,
    'Submitted at': string,
    'Servicer ID': string,
    'Servicer Name': string,

    // for credit table
    'Fiscal Year': string,
    'Appd.LiveTraining': string,
    'LiveTraining Credits': string,
    'Appd.EClass': string,
    'Appd.EClass (Mandatory)': string,
    'EClass Credits': string,
    'Appd.Webinar': string,
    'Webinar Credits': string,
    'Training Credits': string,

    // for user table
    'First Name': string,
    'Last Name': string,
    'Email': string,
    'User Role': string,
    'Created At': string,
    'Updated At': string,

    // for servicer table
    'OptOutFlag': string,
    'TrsiiOptIn': string,
}

export type OrderByType = 'ASC' | 'DESC'

export const tableHeadLabels: TableHeadLabelType = {

    // for training table
    'Training Name': 'training_trainingName',
    'Training Type': 'CAST(training_trainingType AS CHAR)',
    'Trainee Email': 'user_email',
    'Trainee Name': 'user_firstName',
    'Start Date': 'training_startDate',
    'End Date': 'training_endDate',
    'Hours': 'training_hoursCount',
    'Training Status': 'training_trainingStatus',
    'Submitted at': 'training_createdAt',
    'Servicer ID': 'sm_id',
    'Servicer Name': 'sm_servicerMasterName',

    // for user table
    'First Name': 'user_firstName',
    'Last Name': 'user_lastName',
    'Email': 'user_email',
    'User Role': 'userRole_userRoleName',
    'Created At': 'user_createdAt',
    'Updated At': 'user_updatedAt',

    // for credit table
    'Fiscal Year': 'fiscal_year',
    'Appd.LiveTraining': 'live_trng_cnt',
    'LiveTraining Credits': 'live_trng_score',
    'Appd.EClass': 'eclass_trng_cnt',
    'Appd.EClass (Mandatory)': 'eclass_mand_trng_cnt',
    'EClass Credits': 'eclass_trng_score',
    'Appd.Webinar': 'webinar_trng_cnt',
    'Webinar Credits': 'webinar_trng_score',
    'Training Credits': 'training_credit',

    // for servicer table
    'OptOutFlag': 'sm_optOutFlag',
    'TrsiiOptIn': 'sm_trsiiOptIn',
}

export type defaultSortingFieldNameType = {
    trainingTable: string,
    creditTable: string,
    userTable: string,
    servicerTable: string
}

export const defaultSortingFieldName: defaultSortingFieldNameType = {
    trainingTable: 'training_createdAt',
    creditTable: 'fiscalYear',
    userTable: 'user_createAt',
    servicerTable: 'sm_id'
}

export type traineeType = {
    traineeEmail: string,
    traineeFirstName: string,
    traineeLastName: string
}
