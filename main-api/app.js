let AWS = require("aws-sdk");
AWS.config.update({
    region: 'eu-central-1'
});
const uuid = require('uuid/v4');
const jsonxml = require('jsontoxml');
const prettifyXml = require('prettify-xml');

let dbClient = new AWS.DynamoDB();
let docClient = new AWS.DynamoDB.DocumentClient();

// don't verify email when sign up
exports.cognitoPreSignUp = (event, context, callback) => {
    event.response.autoConfirmUser = true;
    callback(null, event);
};

// manage all
function manage(relatedData, event) {

    function getWorkdaysData(cognitoUser, elementId) {
        return new Promise(resolve => {
            let params = {
                TableName: process.env.TABLE_NAME,
                IndexName: relatedData + '-user-index',
                Select: 'ALL_PROJECTED_ATTRIBUTES',
                ExpressionAttributeValues: {
                    ':cognitoUser': cognitoUser,
                },
                KeyConditionExpression: 'cognitoUser = :cognitoUser',
            };

            docClient.query(params, (err, data) => {
                if (err) resolve({ error: { err, params }});
                else {
                    resolve({ success: data });
                }
            });
        });
    }

    function getDayData(cognitoUser, elementId) {
        return new Promise(resolve => {
            let params = {
                TableName: process.env.TABLE_NAME,
                Key: { id: elementId, cognitoUser: cognitoUser }
            };

            docClient.get(params, (err, data) => {
                if (err) resolve({ error: { err, params }});
                else {
                    if (cognitoUser && data.Item.cognitoUser !== cognitoUser) {
                        resolve({ error: 'user is not authorized to get details of this data' });
                    } else {
                        resolve({ success: data });
                    }
                }
            });
        });
    }

    function addWorkday(cognitoUser, body) {
        return new Promise(resolve => {
            let params = {
                TableName: process.env.TABLE_NAME,
                Item: {
                    id: body.id,
                    cognitoUser: cognitoUser,
                    workTime: body.workTime,
                    dayData: body.dayData
                }
            };
            docClient.put(params, (err, data) => {
                if (err) resolve({ error: { err, params }});
                else resolve({ success: params.Item });
            });
        });
    }

    function addDay(cognitoUser, body) {
        return new Promise(resolve => {
            let params = {
                TableName: process.env.TABLE_NAME,
                Key: { id: { 'S': body.dayId }, cognitoUser: { 'S': cognitoUser } },
                UpdateExpression: 'SET dayData[' + body.id.replace('data', '') + '] = :d',
                ExpressionAttributeValues: {':d': {
                        "M": {
                            "begin": {
                                "S": body.begin
                            },
                            "end": {
                                "S": body.end
                            },
                            "id": {
                                "S": body.id
                            },
                            "reason": {
                                "S": body.reason
                            }
                        }
                    }},
                ReturnValues: 'UPDATED_NEW'
            };
            dbClient.updateItem(params, (err, data) => {
                if (err) resolve({ error: { err, params }});
                else resolve({ success: data });
            });
        });
    }

    function editDayContent(cognitoUser, body) {
        return addDay(cognitoUser, body);
    }

    function deleteWorkday(cognitoUser, key) {
        return new Promise(async resolve => {
            let params = {
                TableName: process.env.TABLE_NAME,
                Key: { id: key, cognitoUser: cognitoUser },
                ConditionExpression: 'cognitoUser = :cognitoUser',
                ExpressionAttributeValues: { ':cognitoUser': cognitoUser },
                ReturnValues: 'ALL_OLD'
            };
            docClient.delete(params, (err, data) => {
                if (err) resolve({ error: { err, params }});
                else resolve({ success: data });
            });
        });
    }

    function deleteDay(cognitoUser, key, dayId) {
        return new Promise(resolve => {
            let params = {
                TableName: process.env.TABLE_NAME,
                Key: { id: { 'S': dayId }, cognitoUser: { 'S': cognitoUser } },
                UpdateExpression: 'SET dayData[' + key.replace('data', '') + '] = :d',
                ExpressionAttributeValues: {':d': {
                        "M": {
                            "id": {
                                "S": key
                            },
                            "disabled": {
                                "S": "true"
                            }
                        }
                    }},
                ReturnValues: 'UPDATED_NEW'
            };
            dbClient.updateItem(params, (err, data) => {
                if (err) resolve({ error: { err, params }});
                else resolve({ success: data });
            });
        });
    }

    function getElementId(event) {
        let result = '';
        try {
            result = event.queryStringParameters.id;
        } catch (e) {}
        return result;
    }

    function getDayId(event) {
        let result = '';
        try {
            result = event.queryStringParameters.dayId;
        } catch (e) {}
        return result;
    }

    return async function(event) {
        let cognitoUser = event.requestContext.authorizer.claims;
        let method = event.httpMethod;
        let sentBody = (method === 'GET' || method === 'DELETE') ? {} : JSON.parse(event.body);
        let elementId = getElementId(event);
        let dayId = getDayId(event);
        let action = (method === 'POST' ? event.queryStringParameters.action : '');

        let dbData;
        if (relatedData === 'workdays') {
            if (method === 'GET') {
                dbData = await getWorkdaysData(cognitoUser['cognito:username'], elementId);
            } else if (method === 'POST') {
                if (action === 'add') {
                    dbData = await addWorkday(cognitoUser['cognito:username'], sentBody);
                }
                else dbData = {};
            } else if (method === 'DELETE') {
                dbData = await deleteWorkday(cognitoUser['cognito:username'], elementId);
            }
            else dbData = {};
        } else if (relatedData === 'day') {
            if (method === 'GET') {
                dbData = await getDayData(cognitoUser['cognito:username'], elementId);
            } else if (method === 'POST') {
                if (action === 'add') {
                    dbData = await addDay(cognitoUser['cognito:username'], sentBody);
                } else if (action === 'editDayContent') {
                    dbData = await editDayContent(cognitoUser['cognito:username'], sentBody)
                }
                else dbData = {};
            } else if (method === 'DELETE') {
                dbData = await deleteDay(cognitoUser['cognito:username'], elementId, dayId);
            }
            else dbData = {};
        }
        else dbData = {};

        return {
            'statusCode': 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            'body': JSON.stringify({
                // event,
                dbData,
                tableName: process.env.TABLE_NAME,
                method: method,
                cognitoUser: {
                    username: cognitoUser['cognito:username'],
                    firstname: cognitoUser['custom:firstname'],
                    lastname: cognitoUser['custom:lastname'],
                    email: cognitoUser.email
                },
                sentBody: sentBody,
                elementId: elementId
            })
        };
    }
}

exports.manageWorkdays = manage('workdays');
exports.manageDay = manage('day');
