const db = require('../models/db.js');

const Faculty = require('../models/FacultyModel.js');

const Slot = require('../models/SlotModel.js');

const profileController = {

    getFacultySearch: async function (req, res) {
        try {

            var q = (req.query.q || '').trim().toLowerCase();
            var dept = (req.query.dept || '').trim();
            var query = dept ? { department: dept } : {};

            var facultyList = await db.findMany(Faculty, query);

            var results = facultyList.filter(function (f) {
                if (!q) {
                    return true;
                }
                var haystack = [f.name, f.department]
                    .concat(f.subjects || [])
                    .concat(f.courses || [])
                    .join(' ')
                    .toLowerCase();
                return haystack.indexOf(q) !== -1;
            });

            return res.send(results);
        } catch (err) {
            console.error('Error searching faculty records:', err);
            return res.status(500).send([]);
        }
    },

    getFacultyProfile: async function (req, res) {
        try {

            var query = { id: req.params.id };

            var result = await db.findOne(Faculty, query);

            if (result != null) {

                var slots = await db.findMany(Slot, { facultyId: req.params.id });
                return res.send({
                    ok: true,
                    faculty: result,
                    slots: slots
                });
            }

            else {
                return res.status(404).send({
                    ok: false,
                    error: 'Faculty member not found.'
                });
            }
        } catch (err) {
            console.error('Error retrieving faculty profile:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to load faculty profile.'
            });
        }
    }

};

module.exports = profileController;
