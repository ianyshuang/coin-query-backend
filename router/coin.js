const router = require('express').Router()
const coinController = require('../controller/coin')

router.get('/market/:page', coinController.getCoinMarket)
router.get('/price/24hr/:coin', coinController.getCoinPrice24hr)
router.get('/price/7d/:coin', coinController.getCoinPrice7day)
router.get('/price/30d/:coin', coinController.getCoinPrice30day)
router.get('/ohlc/24hr/:coin', coinController.getCoinOHLC24hr)
router.get('/ohlc/7d/:coin', coinController.getCoinOHLC7day)
router.get('/ohlc/30d/:coin', coinController.getCoinOHLC30day)

module.exports = router