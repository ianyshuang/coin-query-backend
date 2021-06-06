const getTableLatestTime = async (table) => {
  const { dynamoClient } = global
  const coinUpdateTime = await dynamoClient.get({
    TableName: 'CoinUpdateTime',
    Key: { table: table }
  }).promise()
  
  const timeSeries = coinUpdateTime.Item.datetime
  const latestTime = timeSeries[timeSeries.length - 1]

  return latestTime
}

module.exports = {
  getCoinMarket: async (req, res, next) => {
    const { dynamoClient } = global
    let { page } = req.params
    page = parseInt(page)
    
    if (page < 1) {
      return res.status(400).send()
    }

    const tableName = 'CoinMarket'
    const latestTime = await getTableLatestTime(tableName)
    const pageData = await dynamoClient.get({
      TableName: tableName,
      Key: {
        datetime: latestTime,
        page: page
      }
    }).promise()

    return res.status(200).json(pageData)
  }
}