const router = require('express').Router()
const coinController = require('../controller/coin')

router.get('/market/:page', coinController.getCoinMarket)

module.exports = router