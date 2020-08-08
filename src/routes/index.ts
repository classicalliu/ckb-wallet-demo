import express from "express"
let router = express.Router()

/* GET home page. */
router.get('/', (_req, res, _next) => {
  res.render('index', { title: 'Express' });
});

export default router
