function healthCheck(_req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'where-did-our-money-go-api'
  });
}

module.exports = {
  healthCheck
};
