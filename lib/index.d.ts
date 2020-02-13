import * as firestore from "@firebase/firestore-types";
import EventEmitter from "events";

export function setFirestore(_firestore: any): void;

export function field(label: string): Field<unknown>;

export class Field<T> {
  /**
   * Creates an instance of Field.
   *
   * @param {String} _label Field's Label.
   * @memberof Field
   */
  constructor(_label: string);
  /**
   * Validates Field Data against Field.
   *
   * @param {*} fieldData Field Data.
   * @returns Validated Field Data.
   * @memberof Field
   */
  validate(fieldData: T): Promise<T>;
  b;
  /**
   * Validated Field Data at high level.
   *
   * @param {*} fieldData Field Data.
   * @returns Validated Field Data.
   * @memberof Field
   */
  validateField(fieldData: T): Promise<T>;

  /**
   * Validates nested Fields of Object Field.
   *
   * @param {*} fieldData Field Data.
   * @returns Validated Field Data.
   * @memberof Field
   */
  validateObject(fieldData: T): Promise<T>;

  /**
   * Validates nested Fields of Array Field.
   *
   * @param {*} arrayData Array Data.
   * @returns Validated Array Data.
   * @memberof Field
   */
  validateArray(arrayData: T): Promise<T>;

  /**
   * Adds custom filter to stack.
   *
   * @param {Function} filter
   * @returns {this}
   * @memberof Field
   */
  custom(filter: (...args: any) => T): Field<T>;

  /**
   * Defines default value that will be returned if Field Data is undefined.
   *
   * @param {*} defaultValue
   * @returns {this}
   * @memberof Field
   */
  default(defaultValue: T): Field<T>;

  /**
   * Allows Field Data to be null.
   *
   * @returns {this}
   * @memberof Field
   */
  nullable(): Field<T>;

  /**
   * Makes Field optional.
   *
   * @returns {this}
   * @memberof Field
   */
  optional(): Field<T>;

  /**
   * Defines Field as an Array with items defined by nested Field.
   *
   * @param {Field} field Field.
   * @param {*} args
   * @returns {this}
   * @memberof Field
   */
  arrayOf<TSub>(field: Field<TSub>, errorMessage?: string): Field<TSub[]>;

  /**
   * Defines Field as an Object with entries defined by nested Fields.
   *
   * @param {Object<Field>} fields Object of Fields.
   * @param {*} args
   * @returns {this}
   * @memberof Field
   */
  objectOf<T>(
    fields: { [n in keyof T]: Field<T[n]> },
    errorMessage?: string
  ): Field<T>;

  after(date: Date, errorMessage?: string): Field<Date>;
  any(errorMessage?: string): Field<any>;
  array(errorMessage?: string): Field<any[]>;
  before(date: Date, errorMessage?: string): Field<Date>;
  boolean(errorMessage?: string): Field<boolean>;
  date(format: string, errorMessage?: string): Field<Date>;
  email(errorMessage?: string): Field<string>;
  equal(compare: T, errorMessage?: string): Field<T>;
  geopoint(errorMessage?: string): Field<firestore.GeoPoint>;
  integer(errorMessage?: string): Field<number>;
  length(length: number, errorMessage?: string): Field<T>;
  number(errorMessage?: string): Field<number>;
  match(regEx: RegExp, errorMessage?: string): Field<T>;
  max(max: T, errorMessage?: string): Field<T>;
  maxLength(maxLength: number, errorMessage?: string): Field<T>;
  min(min: T, errorMessage?: string): Field<T>;
  minLength(minLength: number, errorMessage?: string): Field<T>;
  object(errorMessage?: string): Field<Object>;
  oneOf(acceptableValues: T[], errorMessage?: string): Field<T>;
  range(min: T, max: T, errorMessage?: string): Field<T>;
  reference(errorMessage?: string): Field<firestore.DocumentReference>;
  string(errorMessage?: string): Field<string>;
  timestamp(errorMessage?: string): Field<firestore.Timestamp>;
  toLowerCase(errorMessage?: string): Field<T>;
  toUpperCase(errorMessage?: string): Field<T>;
  trim(errorMessage?: string): Field<T>;

  _defineType(): void;
  _add(filter: Function): Field<T>;
}

type DataFields = {
  [n: string]: any;
};
type SchemaFields<T extends DataFields> = {
  [n in keyof T]: Field<T[n]>;
};

export function schema<T extends DataFields>(
  fields: SchemaFields<T>
): Schema<T>;

export class Schema<T extends DataFields> {
  /**
   * Creates an instance of Schema.
   *
   * @param {Object<Field>} _fields Object containing Field definitions.
   * @memberof Schema
   */
  constructor(_fields: SchemaFields<T>);

  /**
   * Validates Document Data agains Fields.
   *
   * @param {Object} [data={}]
   * @param {Object<Field>} [fields=this._fields]
   * @returns Validated Document Data.
   * @memberof Schema
   */
  validate(data?: T, fields?: T): Promise<T>;

  /**
   * Validates Document Data against selected Fields.
   *
   * @param {Object} [data={}] Document Data
   * @param {Set} [changedKeys=new Set()] Set with Paths of changed Fields.
   * @returns Valdiated Document Data.
   * @memberof Schema
   */
  validateSelected(data?: T, changedKeys?: Set<string>): Promise<T>;
}

type DataEvent = "created" | "updated" | "deleted";

type WhereModifier<T, K extends keyof T> = {
  key: K;
  opStr: firestore.WhereFilterOp;
  value: T[K];
};

type Hooks<T, M> = {
  [n in keyof T]: ((data: any, obj: M) => void)[];
};

type SubscribeCallback<T> = (document: T | undefined) => void;
type SubscribeCallbackList<T> = (
  documents: T[],
  removedDocuments: T[],
  addedDocuments: T[],
  changedDocuments: T[]
) => void;
type Unsubscribe = () => void;

export function Model<T extends DataFields, M>() {
  abstract class ModelClass {
    /**
     * Creates an instance of Model.
     *
     * @param {DocumentSnapshot} _snapshot - Document Snapshot.
     * @param {Object} _data - Document Data.
     * @returns {Proxy} ModelProxy which handles data setters and getters.
     * @memberof Model
     */
    constructor(_snapshot: firestore.DocumentSnapshot, _data: T);

    get _data(): T;

    /**
     * ID of Document.
     *
     * @readonly
     * @type {String}
     * @memberof Model
     */
    get _id(): string;

    /**
     * Date of Document creation in ISO String format.
     *
     * @readonly
     * @type {String}
     * @memberof Model
     */
    get _createdAt(): string;

    /**
     * Date of Document update in ISO String format.
     *
     * @readonly
     * @type {String}
     * @memberof Model
     */
    get _updatedAt(): string;

    /**
     * Collection Path.
     *
     * @readonly
     * @type {String}
     * @memberof Model
     */
    get _collectionPath(): string;

    /**
     * Collection Reference.
     *
     * @readonly
     * @static
     * @type {CollectionReference}
     * @memberof Model
     */
    static get _collectionRef(): firestore.CollectionReference;

    /**
     * Collection Reference.
     *
     * @readonly
     * @type {String}
     * @memberof Model
     */
    get _collectionRef(): firestore.CollectionReference;

    /**
     * Document Reference.
     *
     * @readonly
     * @type {String}
     * @memberof Model
     */
    get _docRef(): firestore.DocumentReference;

    /**
     * Instance of EventEmitter used with this.on() and this.emit().
     *
     * @readonly
     * @static
     * @type {EventEmitter}
     * @memberof Model
     */
    static get _events(): EventEmitter.EventEmitter;

    /**
     * Subsribes to event.
     *
     * @static
     * @param {String} event - Event name.
     * @param {Function} cb - Callback function.
     * @memberof Model
     */
    static on(event: DataEvent, cb: (obj: T) => Promise<void>): void;

    /**
     * Emits event.
     *
     * @param {String} event - Event name.
     * @memberof Model
     */
    emit(event: DataEvent): void;

    /**
     * Adds hook that will be fired before parsing data
     * if this[path] has changed.
     *
     * @static
     * @param {String} path - Path of property.
     * @param {Function} cb - Callback function.
     * @memberof Model
     */
    static prehook(path: keyof T, cb: (data: any, obj: M) => void): void;

    /**
     * Adds hook that will be fired after parsing data
     * if this[path] has changed.
     *
     * @static
     * @param {String} path - Path of property.
     * @param {Function} cb - Callback function.
     * @memberof Model
     */
    static posthook(path: keyof T, cb: (data: any, obj: M) => void): void;

    /**
     * Processes subscription callback
     *
     * @static
     * @param {QuerySnapshot} querySnap - Path of property.
     * @param {Function} subscriptionCallback - Callback function.
     * @memberof ModelClass
     */
    static _querySubscriptionCallback(
      querySnap: firestore.QuerySnapshot,
      subscriptionCallback: SubscribeCallbackList<M>
    ): void;

    /**
     * Fetches Document by ID.
     *
     * @static
     * @param {String} id
     * @returns {this|null} Instance of Model or null.
     * @memberof Model
     */
    static getById(id: string): Promise<M>;

    /**
     * Fetches Document by ID.
     *
     * @static
     * @param {String} id
     * @param {Function} subscriptionCallback - Subscription Callback.
     * @returns {Function} Unsubscribe.
     * @memberof ModelClass
     */
    static getByIdSubscribe(
      id: string,
      subscriptionCallback: SubscribeCallback<M>
    ): Unsubscribe;

    /**
     * Fetches Document by key and value pair.
     *
     * @static
     * @param {String} key - Key.
     * @param {*} value - Value to compare.
     * @returns {this|null} Instance of this or null.
     * @memberof Model
     */
    static getBy<K extends keyof T>(key: K, value: T[K]): Promise<M>;

    /**
     * Fetches Document by key and value pair.
     *
     * @static
     * @param {String} key - Key.
     * @param {*} value - Value to compare.
     * @param {Function} subscriptionCallback - Subscription Callback.
     * @returns {Function} Unsubscribe.
     * @memberof Model
     */
    static getBySubscribe<K extends keyof T>(
      key: K,
      value: T[K],
      subscriptionCallback: SubscribeCallbackList<M>
    ): Unsubscribe;

    /**
     * Fetches all Documents by key and value pair.
     *
     * @static
     * @param {String} key
     * @param {*} value
     * @param {array} optionalModifiers
     * @returns {Array<this>} Array of instances of this.
     * @memberof Model
     */
    static getAllBy<K extends keyof T>(
      key: K,
      value: T[K],
      optionalModifiers?: WhereModifier<T, keyof T>[]
    ): Promise<M[]>;

    /**
     * Fetches all Documents by key and value pair.
     *
     * @static
     * @param {String} key
     * @param {*} value
     * @param {array} optionalModifiers
     * @param {Function} subscriptionCallback - Subscription Callback.
     * @returns {Function} Unsubscribe.
     * @memberof Model
     */
    static getAllBySubscribe<K extends keyof T>(
      key: K,
      value: T[K],
      optionalModifiers: WhereModifier<T, keyof T>[] | undefined,
      subscriptionCallback: SubscribeCallbackList<M>
    ): Unsubscribe;

    /**
     * Creates new Document.
     *
     * @static
     * @param {Object} [data={}]
     * @returns Instance of this.
     * @memberof Model
     */
    static create(data?: T): Promise<M>;

    /**
     * Deletes Document.
     *
     * @memberof Model
     */
    delete(): Promise<void>;

    /**
     * Saves changes made to Document.
     *
     * @param {*} options
     * @returns This.
     * @memberof Model
     */
    save(options?: firestore.SetOptions): Promise<this>;

    /**
     * Validates Document Data.
     *
     * @param {*} [data={}]
     * @param {boolean} [all=false]
     * @returns Validated Data.
     * @memberof Model
     */
    validate(data?: T, all?: boolean): Promise<T>;

    /**
     * Runs hooks on Document Data.
     *
     * @param {Object} hooks
     * @param {Object} [data={}]
     * @returns Updated Document Data.
     * @memberof Model
     */
    runHooks(hooks: Hooks<true, this>, data?: T): Promise<T>;

    /**
     * Parses Document Data, running hooks and validating it.
     *
     * @param {*} [data=this._data]
     * @param {boolean} [all=false]
     * @returns Updated and Validated Document Data.
     * @memberof Model
     */
    parseData(data?: T, all?: boolean): Promise<T>;

    /**
     * Exposes public data to be shown in API responses.
     *
     * @returns {Object}
     * @memberof Model
     */
    toJSON(): any;

    //[n in T]: T[n];
  }
  return ModelClass;
}

export function asyncForEach(
  array: any[],
  callback: (value: any) => Promise<void>
): void;
