const AWS = require('aws-sdk')
const { appStart } = require('./app')

if (process.env.NODE_ENV === 'development') {
  require('dotenv').config()
}
const dynamoClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: 'ap-northeast-1',
  accessKeyId: process.env.DYNAMO_KEY,
  secretAccessKey: process.env.DYNAMO_SECRET
})

global.dynamoClient = dynamoClient

appStart()