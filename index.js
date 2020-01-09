var AWS = require("aws-sdk");
const { Pool } = require('pg');  //  Needs the nodePostgres Lambda Layer.

const PROD_MODE = true;
const DEV_USERNAME = 'nuttdrive@gmail.com';
const SYSTEM_CODE = '02';
const PRIVILEGE_CODE = '4.1.1';
const TABLE_PURCHASE_ORDER = 'purchase_order'
const TABLE_PURCHASE_ORDER_ITEM = 'purchase_order_item'

let docClient = new AWS.DynamoDB.DocumentClient();
const pool = new Pool();
const createPDF = require('./createPDF')


exports.handler = async (event, context) => {
    console.log("event => ", event);
    context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool

    // Get Username from header
    const username = PROD_MODE ? getUsername(event.requestContext) : DEV_USERNAME;
    if (username == null) {
        doResponse(context, 401, { message: "Unauthorize user " })
        return
    }

    // Get UserSession from DynamoDB
    const userSession = await getUserSession(username, SYSTEM_CODE);
    if (userSession.error != null) {
        doResponse(context, 401, userSession.error)
        return
    }
    const warehouseCode = userSession.data.selectedWarehouseCode;

    // Check User Permission from DynamoDB
    const hasPermission = await checkPermission(username, SYSTEM_CODE, PRIVILEGE_CODE);
    if (hasPermission.error != null) {
        doResponse(context, 401, hasPermission.error)
        return
    }

    const { poNumber } = event.pathParameters != null ? event.pathParameters : { poNumber: null }
    console.log('poNumber => ', poNumber)

    if (poNumber == null) {
        doResponse(context, 401, { message: 'poNumber not found.' })
        return
    }

    // Start Business Logic here
    const client = await pool.connect();
    let purchaseOrderRes;
    let new_purchaseOrderRes;
    let responsePDF
    try {
        // Get PurchaseOrders by user's warehouse
        console.log("query purchase_order by poNumber and warehouseCode");
        const params = queryPurchaseOrderWithPoNumber(warehouseCode, poNumber)
        purchaseOrderRes = await client.query(params.text, params.value);

        if (purchaseOrderRes.rowCount == 0) {
            throw { message: 'poNumber not found.' }
        }

        const {statusCode } = purchaseOrderRes.rows[0];

        if(statusCode != 'OPE'){
            throw { message: 'cannot get pdf purchase order' }
        }

        // Get PurchaseOrdersItem by user's warehouse and poNumber
        console.log("query purchase_order_item by poNumber");
        const paramsPurchaseOrderItem = queryPurchaseOrderItemWithPoNumber(poNumber)
        let purchaseOrderItemRes = await client.query(paramsPurchaseOrderItem.text, paramsPurchaseOrderItem.value);
        //set data for pdf
        console.log('set data for pdf file')
        new_purchaseOrderRes = purchaseOrderRes.rows[0]
        new_purchaseOrderRes.items = purchaseOrderItemRes.rows


        const createPDFRes = await createPDF.genFilePDFAndUploadPDF(new_purchaseOrderRes)
        console.log('createPDFRes => ', createPDFRes);
        //set response
        console.log("set response");
        responsePDF = {
            fileUrl: createPDFRes.Location || '',
            key: createPDFRes.key || ''
        }

    } catch (err) {
        doResponse(context, 401, err)
        return
    }
    finally {
        client.release(true);
    }

    const response = {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        statusCode: 200,
        body: JSON.stringify(responsePDF),
    };
    console.log("response: ", response);
    return response;
};


function queryPurchaseOrderWithPoNumber(warehouse, poNumber) {
    const queryText = `select *
    from master.stock.${TABLE_PURCHASE_ORDER}
    where "warehouseCode" = $1 and "poNumber" = $2;`
    const query = {
        text: queryText,
        value: [warehouse, poNumber]
    }
    return query
}

function queryPurchaseOrderItemWithPoNumber(poNumber) {
    const queryText = `select *
    from master.stock.${TABLE_PURCHASE_ORDER_ITEM}
    where "poNumber" = $1;`
    const query = {
        text: queryText,
        value: [poNumber]
    }
    return query
}

function doResponse(context, statusCode, err) {
    const newError = {
        message: err.message || 'error'
    }
    const response = {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        statusCode: statusCode,
        body: JSON.stringify(newError)
    }
    context.succeed(response)
}


function getUsername(requestContext) {
    try {
        const claims = requestContext.authorizer.claims;
        const username = claims['cognito:username'];
        return username
    } catch (err) {
        console.log("getUsername:", err);
        return null;
    }
}

function buildExpressionByUsernameAndSystemCode(username, systemCode, tableName) {
    let params = {
        TableName: tableName,
        KeyConditionExpression: "#user = :u and #code = :c",
        ExpressionAttributeNames: {
            "#user": "username",
            "#code": "systemCode"
        },
        ExpressionAttributeValues: {
            ":u": username,
            ":c": systemCode
        }
    }

    return params
}

function buildRolePrivilegeExpression(roleKey, rolePrivilegeCode) {
    let params = {
        TableName: "RolePrivilege",
        KeyConditionExpression: "#rk = :r and #cc = :c ",
        FilterExpression: "#alw = :al",
        ExpressionAttributeNames: {
            "#rk": "roleKey",
            "#cc": "code",
            "#alw": "allow"
        },
        ExpressionAttributeValues: {
            ":r": roleKey,
            ":c": rolePrivilegeCode,
            ":al": 'Y'
        }
    };

    return params
}

async function getUserSession(username, systemCode) {
    console.log("getUserSession: ", username, systemCode);
    try {
        const user_session_query = await docClient.query(buildExpressionByUsernameAndSystemCode(username, systemCode, 'UserSession')).promise();
        console.log("UserSession: ", user_session_query);
        if (user_session_query.Count == 1) {
            if (user_session_query.Items[0] && user_session_query.Items[0].sessionProperty) {
                console.log("SessionProperty: ", user_session_query.Items[0].sessionProperty);
                return {
                    data: user_session_query.Items[0].sessionProperty,
                    error: null
                }
            } else {
                return {
                    data: null,
                    error: {
                        message: 'Warehouse not found.'
                    }
                }
            }
        } else {
            return {
                data: null,
                error: {
                    message: 'Username not found.'
                }
            }
        }
    } catch (err) {
        console.log(err);
        return {
            data: null,
            error: err
        }
    }
}

async function checkPermission(username, systemCode, rolePrivilegeCode) {
    console.log("checkPermission:", username, systemCode, rolePrivilegeCode);
    try {
        const user_role_query = await docClient.query(buildExpressionByUsernameAndSystemCode(username, systemCode, "UserRole")).promise();
        if (user_role_query.Count == 1) {
            if (user_role_query.Items[0] && user_role_query.Items[0].roleKey) {
                const roleKey = user_role_query.Items[0].roleKey
                try {
                    const privilege_query = await docClient.query(buildRolePrivilegeExpression(roleKey, rolePrivilegeCode)).promise();
                    if (privilege_query.Count == 1) {
                        return {
                            data: privilege_query.Items[0],
                            error: null
                        }
                    } else {
                        return {
                            data: null,
                            error: {
                                message: "Unauthorize user, " + username
                            }
                        }
                    }

                } catch (err) {
                    return {
                        data: null,
                        error: err
                    }
                }
            } else {
                return {
                    data: null,
                    error: {
                        message: "Unauthorize user, " + username
                    }
                }
            }
        } else {
            return {
                data: null,
                error: {
                    message: "Unauthorize user, " + username
                }
            }
        }
    } catch (err) {
        console.log(err);
        return {
            data: null,
            error: err
        }
    }
}