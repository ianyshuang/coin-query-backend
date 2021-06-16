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
    
  },
  getCoinPrice24hr: async (req, res, next) => {
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
      TableName: 'CoinPrice24hr',
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
      coinPriceSeries = coinPriceSeries.concat(coinPrice.reverse()) // 每個 coinPrice 是最舊的 price 在最前面，要將其 reverse 成最新的在最前面
    }
    const dataPoints = 24 * 60 / 10 // 24 小時的圖，每 10 分鐘為一點，總共需要 24 * 60 / 10 這麼多點
    return res.status(200).json(coinPriceSeries.slice(0, dataPoints).reverse()) // 給前端的要再 reverse 一次（最舊的在最前面）
  },
  getCoinPrice7day: async (req, res, next) => {
    const { dynamoClient } = global

    // 取得該 coin 的 segment
    const { coin } = req.params
    const coinSegment = await getCoinPriceSegment(coin)
    if (!coinSegment) return res.status(400).send({ message: 'bad parameters' })

    // 計算要從哪個時間點開始拿 
    const now = new Date()
    const nowTime = now.getTime()
    now.setHours(0, 0, 0, 0)
    const dateMidTime = now.getTime()
    let start = dateMidTime - 1000 * 60 * 60 * 24 * 7

    // 向 DynamoDB get item
    const data = await dynamoClient.query({
      TableName: 'CoinPrice7day',
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
      coinPriceSeries = coinPriceSeries.concat(coinPrice.reverse()) // 每個 coinPrice 是最舊的 price 在最前面，要將其 reverse 成最新的在最前面
    }
    const dataPoints = 7 * 24 // 7 天的圖，每 1 小時為一點，總共需要 7 * 24 這麼多點
    return res.status(200).json(coinPriceSeries.slice(0, dataPoints).reverse()) // 給前端的要再 reverse 一次（最舊的在最前面）
  },
  getCoinPrice30day: async (req, res, next) => {
    const { dynamoClient } = global

    // 取得該 coin 的 segment
    const { coin } = req.params
    const coinSegment = await getCoinPriceSegment(coin)
    if (!coinSegment) return res.status(400).send({ message: 'bad parameters' })

    // 計算要從哪個時間點開始拿 
    const now = new Date()
    const nowTime = now.getTime()
    now.setHours(0, 0, 0, 0)
    const dateMidTime = now.getTime()
    let start = dateMidTime - 1000 * 60 * 60 * 24 * 30

    // 向 DynamoDB get item
    const data = await dynamoClient.query({
      TableName: 'CoinPrice30day',
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
      coinPriceSeries = coinPriceSeries.concat(coinPrice.reverse()) // 每個 coinPrice 是最舊的 price 在最前面，要將其 reverse 成最新的在最前面
    }
    const dataPoints = 30 * 24 / 6 // 30 天的圖，每 6 小時為一點，總共需要 30 * 24 / 6 這麼多點
    return res.status(200).json(coinPriceSeries.slice(0, dataPoints).reverse()) // 給前端的要再 reverse 一次（最舊的在最前面）
  },
  getCoinOHLC24hr: async (req, res, next) => {
    const { dynamoClient } = global

    // 取得該 coin 的 segment
    const { coin } = req.params
    const coinSegment = await getCoinPriceSegment(coin)
    if (!coinSegment) return res.status(400).send({ message: 'bad parameters' })

    // 向 DynamoDB get item
    const data = await dynamoClient.get({
      TableName: 'CoinOHLC24hr',
      Key: {
        segment: coinSegment
      }
    }).promise()

    const item = data.Item
    if (!item) return res.status(200).json([])

    const { ohlc } = item
    if (coin in ohlc) {
      return res.status(200).json(ohlc[coin])
    } else {
      res.status(200).json([])
    }
  },
  getCoinOHLC7day: async (req, res, next) => {
    const { dynamoClient } = global

    // 取得該 coin 的 segment
    const { coin } = req.params
    const coinSegment = await getCoinPriceSegment(coin)
    if (!coinSegment) return res.status(400).send({ message: 'bad parameters' })

    // 向 DynamoDB get item
    const data = await dynamoClient.get({
      TableName: 'CoinOHLC7day',
      Key: {
        segment: coinSegment
      }
    }).promise()

    const item = data.Item
    if (!item) return res.status(200).json([])

    const { ohlc } = item
    if (coin in ohlc) {
      return res.status(200).json(ohlc[coin])
    } else {
      res.status(200).json([])
    }
  },
  getCoinOHLC30day: async (req, res, next) => {
    const { dynamoClient } = global

    // 取得該 coin 的 segment
    const { coin } = req.params
    const coinSegment = await getCoinPriceSegment(coin)
    if (!coinSegment) return res.status(400).send({ message: 'bad parameters' })

    // 向 DynamoDB get item
    const data = await dynamoClient.get({
      TableName: 'CoinOHLC30day',
      Key: {
        segment: coinSegment
      }
    }).promise()

    const item = data.Item
    if (!item) return res.status(200).json([])

    const { ohlc } = item
    if (coin in ohlc) {
      return res.status(200).json(ohlc[coin])
    } else {
      res.status(200).json([])
    }
  }
}