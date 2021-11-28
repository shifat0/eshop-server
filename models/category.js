const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: String,
  color: String,
});

// converting _id of mongoDB to id for more usable at frontend
categorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});
categorySchema.set("toJSON", { virtuals: true });

exports.Category = mongoose.model("Category", categorySchema);
