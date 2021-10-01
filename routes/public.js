const router = require('express').Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Pesenin API Service' });
});

module.exports = router;