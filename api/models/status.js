const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const statusSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,
        type: String, // may be one of GIF,TEXT,STICKER,..
        data: {
            mediaName: { type: String, default: null }, // name of Gif or Sticker
            msg: String
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Status', statusSchema);