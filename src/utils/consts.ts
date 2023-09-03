export const access_token_expiresIn = '30m'
export const saltRounds = 10
export const maxCredits = 0.01
export const eClassModuleCount = 7
export const logoUrl = 'src/asset/img/logo.png'


export type TableHeadLabelType = {
    'Training Name': string,
    'Training Type': string,
    'Trainee Email': string,
    'Trainee Name': string,
    'Start Date': string,
    'End Date': string,
    'Hours': string,
    'Training Status': string,
    'Training created at': string,
    'Servicer ID': string,
    'Servicer Name': string
}

export type OrderByType = 'ASC' | 'DESC'

export const tableHeadLabels: TableHeadLabelType = {
    'Training Name': 'training_trainingName',
    'Training Type': 'CAST(training_trainingType AS CHAR)',
    'Trainee Email': 'user_email',
    'Trainee Name': 'user_firstName',
    'Start Date': 'training_startDate',
    'End Date': 'training_endDate',
    'Hours': 'training_hoursCount',
    'Training Status': 'training_trainingStatus',
    'Training created at': 'training_createdAt',
    'Servicer ID': 'sm_id',
    'Servicer Name': 'sm_servicerMasterName'
}
