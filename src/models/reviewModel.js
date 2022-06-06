const  mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId

const reviewSchema = new mongoose.Schema({

    
  bookId: { type:ObjectId,required:true, ref :"Book"},

  reviewedBy: {type:String, required:true, default :'Guest',trim:true, value: "reviewer's name"},
  
  reviewedAt: {type:Date, required:true},

  rating: {type:Number, min: 1, max :5, required:true},

  review: {type:String, optional:true,trim:true},

  isDeleted: {type:Boolean, default: false},

},{timestamps:true});


module.exports = mongoose.model('review', reviewSchema)
