const router = require('express').Router()
const coinController = require('../controller/coin')

router.get('/market/:page', coinController.getCoinMarket)
router.get('/price/:coin', coinController.getCoinPriceDay)

module.exports = router