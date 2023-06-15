const mongoose = require("mongoose");

const planetsSchema = new mongoose.Schema({
  keplerName: {
    type: String,
    required: true,
  },
});

const planetsModel = mongoose.model("Planet", planetsSchema);

module.exports = planetsModel;
