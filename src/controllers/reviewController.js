
const BookModel = require("../models/bookModel")
const reviewModel = require("../models/reviewModel")



let nameRegex = /^[A-Za-z]{1}[A-Za-z -]{1,}$/

//validator

const mongoose = require('mongoose')
const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === null) {
        return false
    }
    if (typeof (value).trim().length == 0) {
        return false
    }
    if (typeof (value) === "string" && (value).trim().length > 0) {
        return true
    }
}



//-----------------------CREATE REVIEW ---------------------------------------***

const CreateReview = async function (req, res) {

    try {

        // GETING DATA FROM REQ.BODY

        let data = req.params.bookId
        let body = req.body

 
        if (!isValidObjectId(data)) {
            return res.status(400).send({ Status: false, message: "bookId is not valid, Please enter the exact bookId" })
        }

        let Checkbook = await BookModel.findOne({ _id: data, isDeleted: false })

        if (!Checkbook) {
            return res.status(400).send({ Status: false, message: "Book does not exist / deleted book " })
        }

        if (Object.keys(body).length === 0) {
            return res.status(400).send({ Status: false, message: " Sorry Body can't be empty" })
        }

        if (body.reviewedBy) {
            if (!nameRegex.test(body.reviewedBy)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid reviedwedBy name" })
            }
        }

        if (!body.rating) {
            return res.status(400).send({ Status: false, message: "Please enter the rating" })
        }
        //REGEX VALIDATIONS 
        if (typeof body.rating == "string") {
            return res.status(400).send({ Status: false, message: " rating can't be string " })
        }
        if (body.rating > 5 || body.rating < 1) {
            return res.status(400).send({ Status: false, message: " rating min 1, max 5 " })
        }

        let result = {}
        let bookId = data
        let reviewedBy = body.reviewedBy
        let rating = body.rating
        let reviewedAt = new Date()
        let review = body.review

        //DESTRUCTURE
        result = { bookId, reviewedBy, rating, reviewedAt, review }

        //CREATE REVIEW DOCUMENT
        let ReviewCreate = await reviewModel.create(result)

        //FIND ID AND UPDATE REVIEW

        let UpdateCountReview = await BookModel.findByIdAndUpdate({ _id: data }, { $inc: { reviews: 1 } },{new:true})

        //SELECT PARTICULAR KEY
        let ShowReview = await reviewModel.findOne({ _id: ReviewCreate._id }).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 }).populate("bookId")


        //====================================================================================//
        let reviewsData = await reviewModel.find({bookId:data,isDeleted:false}).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })
        const { _id, title, excerpt, userId, category, subcategory, deleted, reviews, deletedAt, releasedAt, createdAt, updatedAt } = UpdateCountReview
        let display ={}
        display={_id, title, excerpt, userId, category, subcategory, deleted, reviews, deletedAt, releasedAt, createdAt, updatedAt,reviewsData}
        //======================================================================================//

        return res.status(201).send({ Status: true, message: 'Success', data: display })

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }

}

//-----------------------Update REVIEW ---------------------------------------***


const ReviewUpdate = async function (req, res) {

    try {

        let BookIddata = req.params.bookId
        let ReviewId = req.params.reviewId
        let body = req.body
 
        if (!isValidObjectId(ReviewId)) {
            return res.status(400).send({ Status: false, message: "reviewId is not valid, Please enter the exact reviewId" })
        }

        if (!isValidObjectId(BookIddata)) {
            return res.status(400).send({ Status: false, message: "bookId is not valid, Please enter the exact bookId" })
        }

        let Checkbook = await BookModel.findOne({ _id: BookIddata, isDeleted: false })
        
        if (!Checkbook) {
            return res.status(400).send({ Status: false, message: "Book does not exist / deleted book " })
        }
       

        let checkReview = await reviewModel.findOne({ _id: ReviewId, isDeleted: false })

        if (!checkReview) {
            return res.status(400).send({ Status: false, message: "Review does not exist / deleted review " })
        }

        if (Object.keys(body).length === 0) {
            return res.status(400).send({ Status: false, message: " Sorry Body can't be empty" })
        }

        let updateReviewData={}

        if (body.reviewedBy) {
            if (!nameRegex.test(body.reviewedBy)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid reviedwedBy name" })
            }
            updateReviewData.reviewedBy=body.reviewedBy
        }
        if (body.rating) {
            //REGEX VALIDATIONS 
            if (typeof body.rating == "string") {
                return res.status(400).send({ Status: false, message: " rating can't be string " })
            }

            if (body.rating > 5 || body.rating < 1) {
                return res.status(400).send({ Status: false, message: " rating min 1, max 5 " })
            }

            updateReviewData.rating=body.rating

        }
        if(body.review){

            updateReviewData.review=body.review

        }
        // update review, rating, reviewer's name

        let UpdateReview = await reviewModel.findOneAndUpdate({ _id: ReviewId, bookId:BookIddata },updateReviewData, { new: true }).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 }).populate("bookId")
        if(UpdateReview){
        //================================================================================================================//

        let reviewsData = await reviewModel.find({bookId:BookIddata,isDeleted:false}).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })
        const { _id, title, excerpt, userId, category, subcategory, deleted, reviews, deletedAt, releasedAt, createdAt, updatedAt } = Checkbook
        let display ={}
        display={_id, title, excerpt, userId, category, subcategory, deleted, reviews, deletedAt, releasedAt, createdAt, updatedAt,reviewsData}

        //===============================================Final Result============================================================//
        return res.status(200).send({ Status: true, message: 'Success', data: display })
        }
        else{
            return res.status(404).send({ Status: false, message: "Review document does not exist " }) 
        }

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }

}

//-----------------------Delete REVIEW and Decrease the review in Book ---------------------------------------***

const ReviewDelete = async function (req, res) {

    try {

        let BookIddata = req.params.bookId
        let ReviewId = req.params.reviewId

        if (!isValidObjectId(ReviewId)) {
            return res.status(400).send({ Status: false, message: "reviewId is not valid, Please enter the exact reviewId" })
        }

        if (!isValidObjectId(BookIddata)) {
            return res.status(400).send({ Status: false, message: "bookId is not valid, Please enter the exact bookId" })
        }

        let Checkbook = await BookModel.findOne({ _id: BookIddata, isDeleted: false })

        if (!Checkbook) {
            return res.status(400).send({ Status: false, message: "Book does not exist / already deleted " })
        }

        let checkReview = await reviewModel.findOne({ _id: ReviewId, isDeleted: false })

        if (!checkReview) {
            return res.status(400).send({ Status: false, message: "Review doccument does not exist / deleted review " })
        }

        let Deleterieview = await reviewModel.findOneAndUpdate({ _id: ReviewId, bookId:BookIddata}, {isDeleted: true })

        if(Deleterieview){
        let UpdateCountReview = await BookModel.findByIdAndUpdate({ _id: BookIddata }, { $inc: { reviews: -1 } })
        return res.status(200).send({ Status: true, message: 'Success', data: "You review has been deleted" })
        }
        else{
            return res.status(404).send({ Status: false, message: "Review document does not exist " }) 
        }
        
    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }

}


module.exports = { ReviewDelete, CreateReview, ReviewUpdate }


