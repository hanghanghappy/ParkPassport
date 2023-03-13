const express = require('express');
const router = express.Router();
const nationalparks = require('../controllers/nationalparks');
const catchAsync = require('../utils/catchAsync');

const { isLoggedIn, isAuthor, validateNationalPark } = require('../middleware');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const NationalPark = require('../models/nationalpark');

router.route('/')
    .get(catchAsync(nationalparks.index))
    .post(isLoggedIn, upload.array('image'), validateNationalPark, catchAsync(nationalparks.createNationalPark));

router.get('/new', isLoggedIn, nationalparks.renderNewForm);

router.post('/', isLoggedIn, validateNationalPark, catchAsync(nationalparks.createNationalPark));

router.route('/:id')
    .get(catchAsync(nationalparks.showNationalPark))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateNationalPark, catchAsync(nationalparks.updateNationalPark))
    .delete(isLoggedIn, isAuthor, catchAsync(nationalparks.deleteNationalPark));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(nationalparks.renderEditForm))

module.exports = router;