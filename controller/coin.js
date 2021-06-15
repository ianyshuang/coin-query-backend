const getCoinPriceSegment = require('../utils/getCoinPriceSegment')

module.exports = {
  getCoinMarket: async (req, res, next) => {
    const { dynamoClient } = global
    let { page } = req.params
    page = parseInt(page)
    
    if (page < 1) {
      return res.status(400).send()
    }

    const fiveMin = 1000 * 60 * 5 // CoinMarket 更新的頻率為五分鐘
    const now = new Date()
    const nearest = Math.round(now.getTime() / fiveMin) * fiveMin // 取得距離目前最近的 XX:X5 分的 timestamp
    const fetchItems = 2 // 預設要從最近的時間往前取幾個 market item
    
    // 一次發出多個 get item 並使用 (不 await 進而加快 total time)
    // 並使用 Promise.all() 來取得所有回傳結果
    console.time('reading')
    const promiseList = []
    for (let i = 0; i < fetchItems; i++) {
      let time = nearest - i * fiveMin
      let promise = dynamoClient.get({
        TableName: 'CoinMarket',
        Key: { time: time, page: page }
      }).promise()
      promiseList.push(promise)
    }
    
    await Promise.all(promiseList)
      .then(values => {
        // 取出有東西的 item 並 sort in descending order with time
        let items = values.map(v => v.Item).filter(v => v)
        items.sort((prev, next) => next.time - prev.time)

        // 根據是否有 item 回傳錯誤訊息 or 資料
        if (items.length === 0) {
          return res.status(500).json({ message: 'no coin market information available' })
        } else {
          return res.status(200).json(items[0].coinMarket)
        }
      })
      .catch(error => {
        console.log(error)
        return res.status(500).json({ message: error.message })
      })
    
    console.timeEnd('reading')
  },
  getCoinPriceDay: async (req, res, next) => {
    const { dynamoClient } = global

    // 取得該 coin 的 segment
    const { coin } = req.params
    const coinSegment = await getCoinPriceSegment(coin)
    if (!coinSegment) return res.status(400).send({ message: 'bad parameters' })

    // 計算要從哪個時間點開始拿 
    const now = new Date()
    const nowTime = now.getTime()
    now.setHours(12, 0, 0, 0)
    const dateMidTime = now.getTime()
    const buffer = 1000 * 60 * 5
    let start = undefined
    if (nowTime - dateMidTime > buffer) { // 已過今天中午 12 點，從昨天中午 12 點拿
      start = dateMidTime - 1000 * 60 * 60 * 24
    } else {  // 還沒過今天中午 12 點，從昨天凌晨 12 點拿
      start = dateMidTime - 1000 * 60 * 60 * 36
    }


    // 向 DynamoDB get item
    const data = await dynamoClient.query({
      TableName: 'CoinPriceDay',
      KeyConditionExpression: '#segment = :segment and #time >= :start',
      ExpressionAttributeNames: { '#segment': 'segment', '#time': 'time' },
      ExpressionAttributeValues: { ':segment': coinSegment, ':start': start }
    }).promise()

    // 將 items 從日期由近排到遠
    let items = data.Items
    items.sort((prev, next) => next.time - prev.time)
    let coinPriceList = items.map(i => i.coinPrice[coin])
    
    let coinPriceSeries = []
    for (let coinPrice of coinPriceList) {
      coinPriceSeries = coinPriceSeries.concat(coinPrice)
    }
    const dataPoints = 24 * 60 / 5 // 24 小時的圖，每五分鐘為一點，總共需要 24 * 60 / 5 這麼多點
    return res.status(200).json(coinPriceSeries.slice(0, dataPoints))
  }
}