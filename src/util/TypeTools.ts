import '../Typedux'
import * as Immutable from 'immutable'
import {isFunction, toProperCase,Enumerable} from "./index"


const log = getLogger(__filename)

const PropertyTypeMapKey = Symbol('typemutant:property-type-map-key')



function makeErrorMsg(type,msg) {
	return `${type}${(msg) ? ' ' + msg : ''}`
}

/**
 * Not mutable error, when an object is not in
 * mutation phase
 */
export class NotMutableError extends Error {
	constructor(msg:string = null) {
		super(makeErrorMsg('NotMutableError',msg))
	}
}



/**
 * Decorate a model, required for auto-magic immutability
 *
 * @param opts
 * @returns {function(any): undefined}
 * @constructor
 */
export function RecordModel(opts = {}) {
	return (target) => {
		console.log('In decorator')
	}
}

/**
 * Decorate a model property
 *
 * @param opts
 * @returns {function(any, string): undefined}
 * @constructor
 */
export function RecordProperty(opts = {}) {
	return function(target:any,propertyKey:string) {
		const propType = Reflect.getMetadata('design:type',target,propertyKey)

		if (propType) {
			const propTypeMap = Reflect.getMetadata(PropertyTypeMapKey,target) || {}
			propTypeMap[propertyKey] = propType
			Reflect.defineMetadata(PropertyTypeMapKey,propTypeMap,target)
			log.debug(`Decorated ${propertyKey} on ${target.constructor.name} with type ${propType.name}`)
		} else {
			log.warn(`Decorated property ${propertyKey} without type data on ${target.constructor.name}`)
		}


	}
}


/**
 * Typed constructor for models
 */
export interface RecordModelConstructor<T> extends Function {
	new (props?:any): T;
}


/**
 * Mutator function type
 */
export type Mutator<T> = (obj:T) => T


/**
 * Creates mixed types
 *
 * I take no credit for the brilliance in this
 *
 * look in file header for credits
 */
export class RecordTypeWrapper<T, TType extends RecordModelConstructor<T>> {


	/**
	 * Create a new RecordTypeWrapper passing the same type twice
	 * _type = for the instance type, typeof
	 * dupe = the static type, should be identical
	 * @param _type
	 * @param dupe
	 */
	constructor(private _type: new () => T, dupe: TType = undefined) {}

	/**
	 * Return instance type
	 *
	 * @returns {any}
	 */

	get asType(): T {
		return <any>this._type;
	}


	/**
	 * Return the static type
	 *
	 * @returns {any}
	 */
	get asStaticType(): TType {
		return <any>this._type;
	}


	/**
	 * Mix in an additional type
	 *
	 * @param t
	 * @param dupe
	 * @returns {any}
	 */
	mixType<Z, ZType extends new () => Z> (
		t: RecordModelConstructor<Z>,
		dupe: ZType = undefined
	): RecordTypeWrapper<T & Z, RecordModelConstructor<T & Z> & TType & ZType>  {


		return <any>this;
	}




}


/**
 * Immutable class wrapper
 */
export class RecordBaseObject<T extends any,TT extends any> {


	/**
	 * Temporary mutating property
	 * holder while operations are running
	 * this is for performance and
	 * the goal being to limit object creation
	 */
	private recordMutating

	/**
	 * Current object mutable
	 *
	 * @type {boolean}
	 */
	private mutable = false

	/**
	 * Underlying immutable js record
	 */
	private record


	/**
	 * Is the current instance mutable
	 *
	 * @returns {boolean}
	 */
	@Enumerable(false)
	get isMutable() {
		return this.mutable
	}

	/**
	 * Empty constructor for typing purposes
	 */
	constructor()

	/**
	 * Real constructor
	 *
	 * @param typeClazz - the RecordTypeWrapper asType
	 * @param finalClazz - ref to this constructor
	 * @param modelClazz - the underlying model class
	 * @param propTypeMap - the property map used to create the record
	 * @param recordType - the Record.Class
	 * @param props - initial properties
	 */
	constructor(
		typeClazz:{new():TT},
		finalClazz:any,
		modelClazz:{new():T},
		propTypeMap,
		recordType:Immutable.Record.Class,
		props?:any
	)
	constructor(
		private typeClazz?:{new():TT},
		private finalClazz?:any,
		private modelClazz?:{new():T},
		private propTypeMap?,
		private recordType?:Immutable.Record.Class,
		props?:any
	){

		if (!this.record)
			this.record = new recordType(props)

	}


	/**
	 * Type of class, type guards, instance of,
	 * etc, etc
	 *
	 * @returns {string}
	 */
	get type() {
		return typeof this.typeClazz
	}

	/**
	 * withMutation - used by every helper method
	 *
	 * @param mutator
	 * @returns {RecordBaseObject}
	 */
	withMutation(mutator:Mutator<TT>) {
		const newRecord = this.record.withMutations((recordMutating:this) => {
			this.mutable = true
			this.recordMutating = recordMutating

			const result = mutator(this as any)
			this.mutable = false
			this.recordMutating = null
			return result
		})

		return ((newRecord === this.record) ?
			this :
			this.clone(newRecord))

	}

	/**
	 * Set a field with property key
	 *
	 * @param propertyKey
	 * @param newValue
	 * @returns {any}
	 */
	set(propertyKey,newValue):TT {
		return this.withMutation(instance => {

			instance[propertyKey] = newValue
			return instance
		}) as any
	}

	/**
	 * Clone an instance, remember, you will not
	 * have the original model in the prototype chain
	 *
	 * @param newRecord
	 * @returns {any}
	 */
	clone(newRecord = null) {
		const newInstance = new this.finalClazz()

		Object.assign(newInstance,{
			recordType: this.recordType,
			record: newRecord || this.record,
			propTypeMap: this.propTypeMap,
			modelClazz: this.modelClazz,
			mutable: false
		})


		return newInstance
	}

}


/**
 * Create an immutable version of the
 * class provided by merging types
 *
 * https://github.com/shlomiassaf - this dude is AWESOME
 * solved with https://github.com/Microsoft/TypeScript/issues/7934
 *
 * @param modelClazz
 * @returns {modelClazz & RecordBaseObject<T>}
 */
export function makeImmutable<T extends Object>(modelClazz:{new():T}) {


	const typeWrapper = new RecordTypeWrapper(modelClazz,modelClazz)
		.mixType(RecordBaseObject,RecordBaseObject)

	type ComposedRecordType = typeof typeWrapper.asType
	type ComposedRecordConstructorType = RecordModelConstructor<RecordBaseObject<T,ComposedRecordType> & T>

	/**
	 * Create the anonymous class that implements the
	 * ComposedRecordType
	 *
	 * @returns {any}
	 */
	function makeClazz():ComposedRecordConstructorType {

		const propTypeMap = Reflect.getMetadata(PropertyTypeMapKey, modelClazz.prototype)
		if (!propTypeMap)
			throw new Error('No annotated property metadata was found - make sure you have @Model and @Property')


		// Create an instance of the defaults
		const modelInstance = new modelClazz()


		// Map only the defaults
		const recordDefaults = Object.keys(propTypeMap)
			.reduce((recordDefaults, propKey) => {
				recordDefaults[propKey] = modelInstance[propKey]
				return recordDefaults
			}, {})


		// Create an ImmutableRecordClass
		const recordType = Immutable.Record(recordDefaults)


		// Build the final class
		const newClazz = class extends RecordBaseObject<T,ComposedRecordType> {
			constructor(private props = {}) {
				super(typeWrapper.asStaticType,newClazz,modelClazz, propTypeMap, recordType, props)
			}
		}


		// type comboTypeWrapper = typeof typeWrapper.asType

		// Map all the functions first


		Object.getOwnPropertyNames(modelClazz.prototype)
			.filter(propName => propName !== 'constructor' && isFunction(modelClazz.prototype[propName]))
			.forEach(funcName => {
				log.debug(`Defining function "${modelClazz.name}.${funcName}"`)
				newClazz.prototype[funcName] = modelClazz.prototype[funcName]
			})


		Object.keys(propTypeMap)
			.forEach(propName => {
				log.debug(`Defining property "${modelClazz.name}.${propName}"`)


				Object.defineProperty(newClazz.prototype, propName, {
					configurable: false,

					/**
					 * Getter for annotated property
					 * - if this.isMutable, the mutating record
					 *      is used
				     * - otherwise the non mutating record is used
					 * @returns {any}
					 */
					get: function () {
						return (this.isMutable) ?
							this.recordMutating[propName] :
							this.record[propName]
					},

					/**
					 * Setter for @RecordProperty
					 * - sets mutating value, error if not mutating
					 * @param newVal
					 * @throws NotMutableError if not mutating - duh
					 */
					set: function (newVal) {
						if (!this.isMutable)
							throw new NotMutableError(`${modelClazz.name}.${propName}`)


						//throw new MutationRequiresSetterError()
						this.recordMutating[propName] = newVal
					}
				})
			})


		return newClazz as any
	}


	return makeClazz()
}
