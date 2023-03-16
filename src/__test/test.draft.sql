SELECT * FROM
(
SELECT
    `training`.`createdAt` AS `training_createdAt`,
    `training`.`updatedAt` AS `training_updatedAt`,
    `training`.`isActive` AS `training_isActive`,
    `training`.`isDelete` AS `training_isDelete`,
    `training`.`id` AS `training_id`,
    `training`.`trainingName` AS `training_trainingName`,
    `training`.`trainingStatus` AS `training_trainingStatus`,
    `training`.`operatedAt` AS `training_operatedAt`,
    `training`.`note` AS `training_note`,
    `training`.`trainingType` AS `training_trainingType`,
    `training`.`startDate` AS `training_startDate`,
    `training`.`endDate` AS `training_endDate`,
    `training`.`hoursCount` AS `training_hoursCount`,
    `training`.`trainingURL` AS `training_trainingURL`,
    `training`.`userId` AS `training_userId`,
    `training`.`servicerMasterId` AS `training_servicerMasterId`,
    `training`.`operatedById` AS `training_operatedById`,
    `user`.`createdAt` AS `user_createdAt`,
    `user`.`updatedAt` AS `user_updatedAt`,
    `user`.`isActive` AS `user_isActive`,
    `user`.`isDelete` AS `user_isDelete`,
    `user`.`id` AS `user_id`,
    `user`.`email` AS `user_email`,
    `user`.`password` AS `user_password`,
    `user`.`firstName` AS `user_firstName`,
    `user`.`lastName` AS `user_lastName`,
    `user`.`userRoleId` AS `user_userRoleId`,
    `user`.`servicerId` AS `user_servicerId`
    FROM `training` `training`
    INNER JOIN `user` `user` ON `user`.`id`=`training`.`userId` AND (`user`.`email` = :email)
    ORDER BY training_trainingName ASC
) `subQuery`
WHERE
(
    subQuery.training_trainingName LIKE :value OR
    subQuery.training_trainingType LIKE :value OR
    subQuery.training_trainingStatus LIKE :value
)
ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near
':email)ORDER BY training_trainingName ASC) `subQuery` WHERE (subQuery.training_'
at line 1

SELECT
    `training`.`createdAt` AS `training_createdAt`,
    `training`.`updatedAt` AS `training_updatedAt`,
FROM `training` `training`
INNER JOIN `user` `user` ON `user`.`id`=`training`.`userId` AND (`user`.`email` = :email)
ORDER BY training_createdAt DESC

SELECT * FROM
    (
        SELECT
            `training`.`createdAt` AS `training_createdAt`,
            `training`.`updatedAt` AS `training_updatedAt`,
        FROM `training` `training`
        INNER JOIN `user` `user` ON `user`.`id`=`training`.`userId`
        WHERE `user`.`email` = :email
        ORDER BY training_createdAt DESC
    ) `subQuery`
WHERE
    (
        subQuery.training_trainingName LIKE :value OR
        subQuery.training_trainingType LIKE :value OR
        subQuery.training_trainingStatus LIKE :value
     )
ER_PARSE_ERROR:
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near
':email ORDER BY training_createdAt DESC) `subQuery` WHERE (subQuery.training_tra'
at line 1

SELECT
    `training`.`createdAt` AS `training_createdAt`,
    `training`.`updatedAt` AS `training_updatedAt`,
FROM `training` `training`
INNER JOIN `user` `user` ON `user`.`id`=`training`.`userId`
WHERE `user`.`email` = :email
AND (
    training_trainingName LIKE :value OR
    training_trainingType LIKE :value OR
    training_trainingStatus LIKE :value
)
ER_BAD_FIELD_ERROR: Unknown column 'subQuery.training_trainingName' in 'where clause'

SELECT
    `training`.`createdAt` AS `training_createdAt`,
    `training`.`updatedAt` AS `training_updatedAt`,
    `training`.`trainingName` AS `training_trainingName`,
    `training`.`trainingStatus` AS `training_trainingStatus`,
FROM `training` `training`
INNER JOIN `user` `user` ON `user`.`id`=`training`.`userId`
WHERE `user`.`email` = :email
AND (
    training_trainingName LIKE :value OR
    training_trainingType LIKE :value OR
    training_trainingStatus LIKE :value
    )
ER_BAD_FIELD_ERROR: Unknown column 'training_trainingName' in 'where clause'


