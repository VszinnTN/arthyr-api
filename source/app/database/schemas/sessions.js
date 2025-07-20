const { model, Schema } = require("mongoose");

module.exports = model("Sessions", new Schema({
    _id: { type: String, required: true, unique: true },
    sessions: { type: Array, required: false, default: [] }
}))
