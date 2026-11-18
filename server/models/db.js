const mongoose = require('mongoose');

const url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/facultyconnect';

// Reads return plain objects (lean) so they can be passed straight to Handlebars views.
const database = {

    connect: async function () {
        await mongoose.connect(url);
        console.log('Connected to: ' + url);
    },

    insertOne: async function (model, doc) {
        return await model.create(doc);
    },

    insertMany: async function (model, docs) {
        return await model.insertMany(docs);
    },

    findOne: async function (model, query, projection) {
        return await model.findOne(query, projection).lean();
    },

    findMany: async function (model, query, projection) {
        return await model.find(query, projection).lean();
    },

    updateOne: async function (model, filter, update) {
        return await model.updateOne(filter, update);
    },

    updateMany: async function (model, filter, update) {
        return await model.updateMany(filter, update);
    },

    deleteOne: async function (model, conditions) {
        return await model.deleteOne(conditions);
    },

    deleteMany: async function (model, conditions) {
        return await model.deleteMany(conditions);
    }

};

module.exports = database;