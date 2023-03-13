const NationalPark = require('../models/nationalpark');
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
    const nationalparks = await NationalPark.find({}).populate('popupText');
    res.render('nationalparks/index', { nationalparks })
}

module.exports.renderNewForm = (req, res) => {
    res.render('nationalparks/new');
}

module.exports.createNationalPark = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.nationalpark.location,
        limit: 1
    }).send()
    const nationalpark = new NationalPark(req.body.nationalpark);
    nationalpark.geometry = geoData.body.features[0].geometry;
    nationalpark.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    nationalpark.author = req.user._id;
    await nationalpark.save();
    console.log(nationalpark);
    req.flash('success', 'Successfully made a new National Park!');
    res.redirect(`/nationalparks/${nationalpark._id}`)
}

module.exports.showNationalPark = async (req, res,) => {
    const nationalpark = await NationalPark.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!nationalpark) {
        req.flash('error', 'Cannot find that National Park!');
        return res.redirect('/nationalparks');
    }
    res.render('nationalparks/show', { nationalpark });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const nationalpark = await NationalPark.findById(id)
    if (!nationalpark) {
        req.flash('error', 'Cannot find that National Park!');
        return res.redirect('/nationalparks');
    }
    res.render('nationalparks/edit', { nationalpark });
}

module.exports.updateNationalPark = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const nationalpark = await NationalPark.findByIdAndUpdate(id, { ...req.body.nationalpark });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    nationalpark.images.push(...imgs);
    await nationalpark.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await nationalpark.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated National Park!');
    res.redirect(`/nationalparks/${nationalpark._id}`)
}

module.exports.deleteNationalPark = async (req, res) => {
    const { id } = req.params;
    await NationalPark.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted National Park')
    res.redirect('/nationalparks');
}