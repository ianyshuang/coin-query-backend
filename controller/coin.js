

module.exports = {
  getCoinMarket: async (req, res, next) => {
    const { dynamoClient } = global
    let { page } = req.params
    page = parseInt(page)
    
    if (page < 1) {
      return res.status(400).send()
    }

    let interval = 1000 * 60 * 5
    let date = new Date()
    let nearest = new Date(Math.round(date.getTime() / interval) * interval).getTime()
    let result
    while (true) {
      result = await dynamoClient.get({
        TableName: 'CoinMarket',
        Key: {
          datetime: nearest,
          page: page
        }
      }).promise()
      if (Object.keys(result).length === 0) {
        nearest -= interval;
      } else {
        break
      }
    }
    return res.status(200).json(result)
  }
}