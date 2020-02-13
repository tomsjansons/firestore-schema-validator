const moment = require('moment')
const EventEmitter = require('events')

const { getFirestore } = require('./firestore')
const ModelProxy = require('./ModelProxy')
const Schema = require('./Schema')

const { asyncForEach, markAsChanged } = require('./helpers')

/**
 * Boilerplate ODM to interact with Cloud Firestore.
 * Must be extended.
 *
 * @class Model
 */
class ModelClass {
  /**
   * Creates an instance of Model.
   *
   * @param {DocumentSnapshot} _snapshot - Document Snapshot.
   * @param {Object} _data - Document Data.
   * @returns {Proxy} ModelProxy which handles data setters and getters.
   * @memberof ModelClass
   */
  constructor(_snapshot, _data) {
    if (this.constructor === Model || this.constructor === ModelClass)
      throw new Error('Model can\'t be used directly and must be extended instead.')

    const name = this.constructor.name

    if (!(_snapshot instanceof getFirestore().firestore.DocumentSnapshot))
      throw new Error(`${name} constructor must be called with instance of DocumentSnapshot.`)

    if (!this.constructor._collectionPath)
      throw new Error(`${name} must have a static getter _collectionPath.`)

    if (typeof this.constructor._collectionPath !== 'string')
      throw new Error(`${name}'s static getter _collectionPath must return a string.`)

    if (!this.constructor._schema)
      throw new Error(`${name} must have a static getter _schema.`)

    if (!(this.constructor._schema instanceof Schema))
      throw new Error(`${name}'s static getter _schema must return an instance of Schema.`)

    this._snapshot = _snapshot
    this._data = _data || this._snapshot.data() || {}
    this._changedKeys = new Set()

    this._proxy = new ModelProxy(this)

    return this._proxy
  }


  /**
   * ID of Document.
   *
   * @readonly
   * @type {String}
   * @memberof ModelClass
   */
  get _id() {
    return this._snapshot.id
  }

  /**
   * Date of Document creation in ISO String format.
   *
   * @readonly
   * @type {String}
   * @memberof ModelClass
   */
  get _createdAt() {
    const createTime = this._snapshot.createTime

    if (!createTime)
      return moment()
        .toISOString()

    return moment
      .unix(createTime.seconds)
      .toISOString()
  }

  /**
   * Date of Document update in ISO String format.
   *
   * @readonly
   * @type {String}
   * @memberof ModelClass
   */
  get _updatedAt() {
    const updateTime = this._snapshot.updateTime

    if (!updateTime)
      return null

    return moment
      .unix(updateTime.seconds)
      .toISOString()
  }

  /**
   * Collection Path.
   *
   * @readonly
   * @type {String}
   * @memberof ModelClass
   */
  get _collectionPath() {
    return this.constructor._collectionPath
  }

  /**
   * Collection Reference.
   *
   * @readonly
   * @static
   * @type {CollectionReference}
   * @memberof ModelClass
   */
  static get _collectionRef() {
    return getFirestore()
      .firestore()
      .collection(this._collectionPath)
  }

  /**
   * Collection Reference.
   *
   * @readonly
   * @type {String}
   * @memberof ModelClass
   */
  get _collectionRef() {
    return this.constructor._collectionRef
  }

  /**
   * Document Reference.
   *
   * @readonly
   * @type {String}
   * @memberof ModelClass
   */
  get _docRef() {
    return this._collectionRef
      .doc(this._id)
  }

  /**
   * Instance of EventEmitter used with this.on() and this.emit().
   *
   * @readonly
   * @static
   * @type {EventEmitter}
   * @memberof ModelClass
   */
  static get _events() {
    if (!this._emitter)
      this._emitter = new EventEmitter()

    return this._emitter
  }

  /**
   * Subsribes to event.
   *
   * @static
   * @param {String} event - Event name.
   * @param {Function} cb - Callback function.
   * @memberof ModelClass
   */
  static on(event, cb) {
    this._events.on(event, cb)
  }

  /**
   * Emits event.
   *
   * @param {String} event - Event name.
   * @memberof ModelClass
   */
  emit(event) {
    this.constructor._events.emit(event, this)
  }

  /**
   * Adds hook that will be fired before parsing data
   * if this[path] has changed.
   *
   * @static
   * @param {String} path - Path of property.
   * @param {Function} cb - Callback function.
   * @memberof ModelClass
   */
  static prehook(path, cb) {
    if (!this._prehooks)
      this._prehooks = {}

    if (!Array.isArray(this._prehooks[path]))
      this._prehooks[path] = []

    this._prehooks[path].push(cb)
  }

  /**
   * Adds hook that will be fired after parsing data
   * if this[path] has changed.
   *
   * @static
   * @param {String} path - Path of property.
   * @param {Function} cb - Callback function.
   * @memberof ModelClass
   */
  static posthook(path, cb) {
    if (!this._posthooks)
      this._posthooks = {}

    if (!Array.isArray(this._posthooks[path]))
      this._posthooks[path] = []

    this._posthooks[path].push(cb)
  }

  /**
   * Processes subscription callback
   *
   * @static
   * @param {QuerySnapshot} querySnap - Path of property.
   * @param {Function} subscriptionCallback - Callback function.
   * @memberof ModelClass
   */
  static _querySubscriptionCallback(querySnap, subscriptionCallback) {
    const removedDocuments = []
    const addedDocuments = []
    const changedDocuments = []

    querySnap.docChanges().forEach(change => {
      if (change.type === 'removed') {
        removedDocuments.push(new this(change.doc))
      }
      else if (change.type === 'added') {
        addedDocuments.push(new this(change.doc))
      }
      else if (change.type === 'modified') {
        changedDocuments.push(new this(change.doc))
      }
    })
    const results = []
    querySnap.forEach(queryDocSnap => {
      results.push(new this(queryDocSnap))
    })
    subscriptionCallback(results, removedDocuments, addedDocuments, changedDocuments)
  }

  /**
   * Fetches Document by ID.
   *
   * @static
   * @param {String} id
   * @returns {this|null} Instance of Model or null.
   * @memberof ModelClass
   */
  static async getById(id) {
    const snapshot = await this._collectionRef
      .doc(id)
      .get()

    if (!snapshot.exists)
      return null

    return new this(snapshot)
  }

  /**
   * Fetches Document by ID and subscribe.
   *
   * @static
   * @param {String} id
   * @returns {this|null} Instance of Model or null.
   * @param {Function} subscriptionCallback - Subscription Callback.
   * @returns {Function} Unsubscribe.
   * @memberof ModelClass
   */
  static getByIdSubscribe(id, subscriptionCallback) {
    const documentRef = this._collectionRef.doc(id)

    return documentRef.onSnapshot(documentSnap => {
      if (documentSnap.exists) {
        subscriptionCallback(new this(documentSnap))
      }
      else {
        subscriptionCallback(undefined)
      }
    })
  }

  /**
   * Fetches Document by key and value pair.
   *
   * @static
   * @param {String} key - Key.
   * @param {*} value - Value to compare.   
   * @returns {this|null} Instance of this or null.
   * @memberof ModelClass
   */
  static async getBy(key, value) {
    const querySnapshot = await this._collectionRef
      .where(key, '==', value)
      .limit(1)
      .get()

    if (!querySnapshot.docs.length)
      return null

    const snapshot = querySnapshot.docs[0]

    return new this(snapshot)
  }

  /**
   * Fetches Document by key and value pair.
   *
   * @static
   * @param {String} key - Key.
   * @param {*} value - Value to compare.
   * @param {Function} subscriptionCallback - Subscription Callback.
   * @returns {Function} Unsubscribe.
   * @memberof ModelClass
   */
  static getBySubscribe(key, value, subscriptionCallback) {
    const query = this._collectionRef.where(key, '==', value)

    return query.onSnapshot(querySnap => {
      this._querySubscriptionCallback(querySnap, subscriptionCallback)
    })
  }

  /**
   * Fetches all Documents by key and value pair.
   *
   * @static
   * @param {String} key
   * @param {*} value
   * @param {array} optionalModifiers
   * @returns {Array<this>} Array of instances of this.   
   * @memberof ModelClass
   */
  static async getAllBy(key, value, optionalModifiers) {
    let query = this._collectionRef
      .where(key, '==', value)

    if (Array.isArray(optionalModifiers) && optionalModifiers.length > 0)
      for (const modifier of optionalModifiers) {
        query = query.where(modifier.key, modifier.opStr, modifier.value)
      }

    const querySnapshot = await query.get()

    return querySnapshot.docs
      .map(snapshot => new this(snapshot))
  }

  /**
   * Fetches all Documents by key and value pair.
   *
   * @static
   * @param {String} key
   * @param {*} value
   * @param {array} optionalModifiers   
   * @param {Function} subscriptionCallback - Subscription Callback.
   * @returns {Function} Unsubscribe.
   * @memberof ModelClass
   */
  static getAllBySubscribe(key, value, optionalModifiers, subscriptionCallback) {
    let query = this._collectionRef
      .where(key, '==', value)

    if (Array.isArray(optionalModifiers) && optionalModifiers.length > 0)
      for (const modifier of optionalModifiers) {
        query = query.where(modifier.key, modifier.opStr, modifier.value)
      }

    return query.onSnapshot(querySnap => {
      this._querySubscriptionCallback(querySnap, subscriptionCallback)
    })
  }

  /**
   * Creates new Document.
   *
   * @static
   * @param {Object} [data={}]
   * @returns Instance of this.
   * @memberof ModelClass
   */
  static async create(data = {}) {
    const snapshot = await this._collectionRef.doc()
      .get()

    const instance = new this(snapshot, data)
    markAsChanged(instance._changedKeys, data)

    instance._data = await instance.parseData(data, true)

    await instance._docRef
      .set(instance._data)

    instance.emit('created')

    return instance
  }

  /**
   * Deletes Document.
   *
   * @memberof ModelClass
   */
  async delete() {
    await this._docRef
      .delete()

    this.emit('deleted')
  }

  /**
   * Saves changes made to Document.
   *
   * @param {*} options
   * @returns This.
   * @memberof ModelClass
   */
  async save(options) {
    const data = await this.parseData()

    await this._docRef
      .set(data, options)

    this._data = data

    this.emit('updated')

    return this
  }

  /**
   * Validates Document Data.
   *
   * @param {*} [data={}]
   * @param {boolean} [all=false]
   * @returns Validated Data.
   * @memberof ModelClass
   */
  async validate(data = {}, all = false) {
    if (all)
      return await this.constructor._schema.validate(data)

    return await this.constructor._schema.validateSelected(data, this._changedKeys)
  }

  /**
   * Runs hooks on Document Data.
   *
   * @param {Object} hooks
   * @param {Object} [data={}]
   * @returns Updated Document Data.
   * @memberof ModelClass
   */
  async runHooks(hooks, data = {}) {
    /* eslint no-await-in-loop: 0 */
    /* eslint no-loop-func: 0 */
    if (!hooks)
      return data

    for (const changedKey of this._changedKeys.keys())
      if (Array.isArray(hooks[changedKey]))
        await asyncForEach(
          hooks[changedKey],
          async (cb) => await cb(data, this),
        )

    return data
  }

  /**
   * Parses Document Data, running hooks and validating it.
   *
   * @param {*} [data=this._data]
   * @param {boolean} [all=false]
   * @returns Updated and Validated Document Data.
   * @memberof ModelClass
   */
  async parseData(data = this._data, all = false) {
    data = await this.runHooks(this.constructor._prehooks, data)
    data = await this.validate(data, all)
    data = await this.runHooks(this.constructor._posthooks, data)

    this._changedKeys = new Set()

    return data
  }

  /**
   * Exposes public data to be shown in API responses.
   *
   * @returns {Object}
   * @memberof ModelClass
   */
  toJSON() {
    return this._data
  }
}

function Model() {
  return ModelClass
}

module.exports = Model
