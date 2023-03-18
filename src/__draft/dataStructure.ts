

const structure = [
    {
        smId: '00001',
        smName: 'aaa',
        approvedEClass: 2,
        approvedLiveTraining: 3,
        approvedWebinar: 5,
        credits: '0.4%',
        users: [
            {
                userEmail: 'janedoe@gmail.com',
                userName: 'jane doe',
                approvedEClass: 1,
                approvedLiveTraining: 2,
                approvedWebinar: 3,
            },
            {
                userEmail: 'janedoe2@gmail.com',
                userName: 'jane doe2',
                approvedEClass: 1,
                approvedLiveTraining: 2,
                approvedWebinar: 3,
            },
        ],
    },

    {
        smId: '00002',
        smName: 'bbb',
        approvedEClass: 2,
        approvedLiveTraining: 3,
        approvedWebinar: 5,
        credits: '0.4%',
        users: [
            {
                userEmail: 'janedoe@gmail.com',
                userName: 'jane doe',
                approvedEClass: 1,
                approvedLiveTraining: 2,
                approvedWebinar: 3,
            }
        ],
    },

]


const original = [
    {
        "smId": "00001",
        "smName": "Acme Mortgage",
        "trainingType": "LiveTraining",
        "trainingCount": "1"
    },
    {
        "smId": "00001",
        "smName": "Acme Mortgage",
        "trainingType": "ECLASS",
        "trainingCount": "2"
    },
    {
        "smId": "00001",
        "smName": "Acme Mortgage",
        "trainingType": "Webinar",
        "trainingCount": "1"
    },
    {
        "smId": "00002",
        "smName": "Acme Mortgage2",
        "trainingType": "Webinar",
        "trainingCount": "1"
    }
]

const target = [
    {
        smId: "00001",
        smName: "Acme Mortgage",
        approvedEClass: 2,
        approvedLiveTraining: 3,
        approvedWebinar: 5,
    },
    {
        smId: "00002",
        smName: "Acme Mortgage2",
        approvedEClass: 1,
        approvedLiveTraining: 1,
        approvedWebinar: 4,
    }
]
