module.exports = async (coin) => {
  const { dynamoClient } = global
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const data = await dynamoClient.get({
    TableName: 'CoinList',
    Key: { dateTime: now.getTime() }
  }).promise()

  return data.Item.coinPriceSegment[coin]
}