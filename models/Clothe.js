const mongoose = require("mongoose");

// Save a reference to the Schema constructor
const Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
const ClotheSchema = new Schema({
  title: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  link: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  saved: {
    type: Boolean,
    default: false
  },
  notes: [{
    type: Schema.Types.ObjectId,
    ref: "Note"
  }]
});

// This creates our model from the above schema, using mongoose's model method
const Clothe = mongoose.model("Clothe", ClotheSchema);

//Clothe.createIndexes();

// Export the Clothe model
module.exports = Clothe;
