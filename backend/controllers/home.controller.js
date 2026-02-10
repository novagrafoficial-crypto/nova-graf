const HomeModel = require("../models/home.model");

const getHomeInfo = (req, res) => {
  const data = HomeModel.getInfo();

  res.status(200).json(data);
};

module.exports = { getHomeInfo };
