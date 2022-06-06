const BookModel = require("../models/bookModel")
const userModel = require("../models/userModel")
const reviewModel = require("../models/reviewModel")
var moment = require('moment');
const validUrl = require("valid-url");

//-------------------Validator for ObjectId -------------------------------------//

const mongoose = require('mongoose')
const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}



// all regex validtaion

let nameRegex = /^[A-Za-z]{1}[A-Za-z ,-]{1,}$/
let titleRegex = /^[A-Za-z1-9]{1}[A-Za-z0-9 ,-?]{0,10000}$/

let ISBNRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$$/

let today = new Date();
let indianTime = today.toLocaleString("en-US", 'Asia/Kolkata');


//----------------------------------CREATE BOOK-----------------------------***

const Bookcreate = async function (req, res) {

    try {

        let body = req.body
        let Files = req.files
        //if req.body is empty

        if (Object.keys(body).length === 0) {
            return res.status(400).send({ Status: false, message: " Sorry Body can't be empty" })
        }

        //***********======================   getting data from body  ======================***********   //


        if (!body.userId) {
            return res.status(400).send({ Status: false, message: " Please enter userId" })
        }

        if (!isValidObjectId(body.userId)) {
            return res.status(400).send({ Status: false, message: " This is not valid userId" })
        }

        //********** ===================================== Applying authorization ================================================= *//

        const Verification = req.userId        // this is being import from middleware mid1

        let checkUserdetail = await userModel.findOne({ _id: body.userId })

        if (!checkUserdetail) {
            return res.status(400).send({ Status: false, message: " No user found from given userId" })
        }

        if (checkUserdetail) {
            if (Verification != checkUserdetail._id) {
                return res.status(400).send({ Status: false, message: "You are not authorise person for create the book" })
            }
        }


        //************************************************************************************************************************//

        if (body.isDeleted === true) {
            return res.status(400).send({ Status: false, message: " Sorry  you are not allowed to create a book " })
        }

        // title validation

        if (!body.title) {
            return res.status(400).send({ Status: false, message: " Title is required" })
        }
        // using  regex validation 
        if (!titleRegex.test(body.title)) {
            return res.status(400).send({ Status: false, message: " Title is not valid format" })
        }
        // using validation
        if (!body.excerpt) {
            return res.status(400).send({ Status: false, message: " excerpt is required" })
        }
        // using  regex validation 
        if (!titleRegex.test(body.excerpt)) {
            return res.status(400).send({ Status: false, message: " excerpt is not valid format" })
        }
        //------- Checking ISBN & validation ---------------------- //
        if (!body.ISBN) {
            return res.status(400).send({ Status: false, message: " ISBN is required" })
        }
        if (!ISBNRegex.test(body.ISBN)) {
            return res.status(400).send({ Status: false, message: " ISBN is not in valid format" })
        }

        if (typeof body.ISBN === "number") {
            return res.status(400).send({ Status: false, message: " ISBN must be as a string" })
        }


        //------- Checking category, subcategory,reviews & validation ---------------------- //

        if (!body.category) {
            return res.status(400).send({ Status: false, message: " category is required" })
        }
        if (!nameRegex.test(body.category)) {
            return res.status(400).send({ Status: false, message: " category is not in valid format" })
        }

        if (!body.subcategory) {
            return res.status(400).send({ Status: false, message: " subcategory is required" })
        }
        if (!nameRegex.test(body.subcategory)) {
            return res.status(400).send({ Status: false, message: " subcategory is not in valid format" })
        }

        if (body.reviews > 0) {
            return res.status(400).send({ Status: false, message: " Sorry you can not create review yourself" })
        }



        //***----------------------------------------------------------------------------------------------------------*******/
        if (body.bookCover) {
            if (!validUrl.isWebUri(body.bookCover)) {

                return res.status(400).send({ status: false, message: "Looks like not a valid URL of bookCover" });
            }
        }

        //=========================YYYY-MM-DD , we have to use validation for this=======================================//


        if (!body.releasedAt) {
            return res.status(400).send({ Status: false, message: " releasedAt is required,please use this format YYYY-MM-DD " })
        }

        let date1 = moment.utc(body.releasedAt, 'YYYY-MM-DD') // UNIVERSAL TIME COORDINATED,IF WE ONLY USE MOMENT SO IT WORK IN LOCAL MODE
        if (!date1.isValid()) {
            return res.status(400).send({ status: false, message: "Invalid Date" })
        }

        body.releasedAt = date1

        //*==============================================================================================*//

        let Checkuniquedata = await BookModel.findOne({ $or: [{ title: body.title }, { ISBN: body.ISBN }] })
        if (Checkuniquedata) {
            if (Checkuniquedata.title == body.title) {
                return res.status(400).send({ Status: false, message: " This title has been used already" })
            }
            if (Checkuniquedata.ISBN === body.ISBN) {
                return res.status(400).send({ Status: false, message: " This ISBN has been used already" })
            }
        }

        let CreateBook = await BookModel.create(body)

        return res.status(201).send({ Status: true, message: 'Success', data: CreateBook })

    }
    catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}


//------------------------------GET BOOK -------------------------------------------***

const GetBook = async function (req, res) {
    try {

        let query = req.query

        if (query.title || query.excerpt || query.releasedAt || query.reviews || query._id) {
            return res.status(404).send({ Status: false, message: " You can't get data with given filter" })
        }

        //------------------------------------------------------------------------------------------------------------//

        let filterData = { isDeleted: false }

        if (query.category) {
            if (!nameRegex.test(query.category)) {
                return res.status(400).send({ Status: false, message: " category is not in valid format" })
            }
            filterData.category = query.category
        }
        if (query.subcategory) {
            if (!nameRegex.test(query.subcategory)) {
                return res.status(400).send({ Status: false, message: " subcategory is not in valid format" })
            }
            filterData.subcategory = query.subcategory
        }
        if (query.userId) {
            if (!isValidObjectId(query.userId)) {
                return res.status(400).send({ Status: false, message: " This is not valid userId" })
            }
            filterData.userId = query.userId
        }

        // console.log("filter data:   ",filterData)

        let FindAllBook = await BookModel.find(filterData).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).collation({ locale: "en" }).sort({ title: 1 })

        if (FindAllBook.length > 0) {
            return res.status(200).send({ Status: true, message: 'Success', data: FindAllBook })
        }
        else {
            return res.status(404).send({ Status: false, message: " No data found or it can be deleted" })
        }
    }
    catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}

//------------------------------------- GET BOOK BY PARAM----------------------------***

const resultBook = async function (req, res) {
    try {
        let data = req.params.bookId

        if (data.length !== 24) {
            return res.status(400).send({ Status: false, message: "Bookid is not valid, please enter 24 digit of bookid" })
        }

        let checkBook = await BookModel.findOne({ _id: data })

        if (!checkBook) {
            return res.status(404).send({ Status: false, message: "Book does not exist" })
        }

        let checkuser = await userModel.findOne({ _id: checkBook.userId })

        if (!checkuser) {
            return res.status(400).send({ Status: false, message: "user id does not exist" })
        }

        let FindBook = await BookModel.findById({ _id: req.params.bookId })

        let reviewsData = await reviewModel.find({ bookId: req.params.bookId, isDeleted: false }).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })


        const { _id, title, excerpt, userId, category, subcategory, deleted, reviews, deletedAt, releasedAt, createdAt, updatedAt } = FindBook

        //*********------- Getting book data if it is deleted--------------------------------*********************//

        if (FindBook.isDeleted === true) {
            let resultant = {}
            resultant = { _id, title, excerpt, userId, category, subcategory, deleted, reviews, deletedAt, releasedAt, createdAt, updatedAt, reviewsData, reviewsData }
            return res.status(404).send({ Status: false, message: 'This is deleted book' })
        }

        //*********------- Getting book data if it is not deleted--------------------------------*********************//
        let dataa = {}
        dataa = { _id, title, excerpt, userId, category, subcategory, deleted, reviews, deletedAt: "", releasedAt, createdAt, updatedAt, reviewsData }

        return res.status(200).send({ Status: true, message: 'Success', data: dataa })

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }

}

//--------------------------------------UPDATE BOOK BY PARAMS(BOOKID)---------------------------*********//

const UpdateBook = async function (req, res) {

    try {

        let body = req.body
        let data = req.params

        if (Object.keys(body).length === 0) {
            return res.status(400).send({ Status: false, message: " Sorry Body can't be empty" })
        }

        let dataForUpdate = {}

        //--------------------------Checking title if coming-------------------------------------//

        if (body.title) {
            if (!titleRegex.test(body.title)) {
                return res.status(400).send({ Status: false, message: " Title is not valid format" })
            }
            dataForUpdate.title = body.title
        }

        //-------------------------------Checking ISBN if coming-----------------------------//

        if (body.ISBN) {
            if (typeof body.ISBN === "number") {
                return res.status(400).send({ Status: false, message: " ISBN must be as a string" })
            }
            if (!ISBNRegex.test(body.ISBN)) {
                return res.status(400).send({ Status: false, message: " ISBN is not in valid format" })
            }
            dataForUpdate.ISBN = body.ISBN
        }


        //*******-----------Checking Unique title or ISBN if it is coming from body -----------************//

        let CheckData = await BookModel.findOne({ $or: [{ title: body.title }, { ISBN: body.ISBN }] })

        if (CheckData) {
            if (CheckData.isDeleted === true) {
                return res.status(404).send({ Status: false, message: " This book is deleted book" })
            }
            if (CheckData.title === body.title) {
                return res.status(400).send({ Status: false, message: " This title has been used already" })
            }
            if (CheckData.ISBN === body.ISBN) {
                return res.status(400).send({ Status: false, message: " This ISBN has been used already" })
            }
        }
        //*******-----------Checking releasedAt if it is coming then validate-------------***************//

        if (body.releasedAt) {
            let date1 = moment.utc(body.releasedAt, 'YYYY-MM-DD') // UNIVERSAL TIME COORDINATED,IF WE ONLY USE MOMENT SO IT WORK IN LOCAL MODE
            if (!date1.isValid()) {
                return res.status(400).send({ status: false, message: "Invalid Date" })
            }
            dataForUpdate.releasedAt = body.releasedAt
        }

        //****************************Checking excerpt at if coming**********************************************************/
        if (body.excerpt) {
            if (!titleRegex.test(body.excerpt)) {
                return res.status(400).send({ Status: false, message: " excerpt is not valid format" })
            }
            dataForUpdate.excerpt = body.excerpt
        }
        //----------------------------------------- Updating book -----------------------------------------------------------//

        console.log("changes:   ",dataForUpdate)

        let CheckDeleted = await BookModel.findOneAndUpdate({ $and: [{ _id: data.bookId }, { isDeleted: false }] }, dataForUpdate, { new: true }).select({ "__v": 0 })

        if (CheckDeleted) {
            return res.status(200).send({ Status: true, message: 'Success', data: CheckDeleted })
        }
        else {
            return res.status(404).send({ Status: false, message: " Sorry you can't update this book due to deleted book" })
        }
    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}

//----------------------------------------- DeleteBook BY PARAMS----------------------------***

const DeleteBook = async function (req, res) {
    try {

        let data = req.params

        let BookId = data.bookId

        let CheckDeleted = await BookModel.findOneAndUpdate({ $and: [{ _id: data.bookId }, { isDeleted: false }] }, { $set: { isDeleted: true, deletedAt: indianTime } }, { new: true })

        if (!CheckDeleted) {
            return res.status(404).send({ Status: false, message: " This book is deleted book" })
        }

        // if book is being delete, then we will delete the all review for that book

        let UpdateDeleteReview = await reviewModel.updateMany({ bookId: BookId }, { isDeleted: true })

        // sending the bookdeleted data for response 

        return res.status(200).send({ Status: true, message: 'Successfully deleted the book', data: CheckDeleted })

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}

//-----------------------------EXPORT ALL API FUNCTION----------------------------------***


module.exports = { Bookcreate, GetBook, resultBook, UpdateBook, DeleteBook }