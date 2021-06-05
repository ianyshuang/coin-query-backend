const router = require('express').Router()

router.use('/coin', require('./coin'))

module.exports = router