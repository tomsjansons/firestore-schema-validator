const Field = require('./Field')
const Schema = require('./Schema')
const Model = require('./Model')
const StructureError = require('./StructureError')
const ValidationError = require('./ValidationError')
const { setFirestore } = require('./firestore')

module.exports = {
  field(...args) {
    return new Field(...args)
  },
  schema(...args) {
    return new Schema(...args)
  },
  Field,
  Schema,
  Model,
  StructureError,
  ValidationError,
  setFirestore
}
