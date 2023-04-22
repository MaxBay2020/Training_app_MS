import User from "../entities/User";

export type UserWithDetails = User &  {
    userName: string,
    servicerId: string,
    servicerMasterName: string,
}

export type Trainee = {
    traineeEmail: string,
    traineeFirstName: string,
    traineeLastName: string,
}

