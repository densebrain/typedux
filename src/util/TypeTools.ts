import '../Typedux'
import * as Immutable from 'immutable'
import {isFunction, toProperCase,Enumerable} from "./index"


const log = getLogger(__filename)

const PropertyTypeMapKey = Symbol('typemute:property-type-map-key')



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

export class MutationRequiresSetterError extends Error {
	constructor(msg:string = null) {
		super(makeErrorMsg('MutationRequiresSetterError',msg))
	}
}



/**
 * Decorate a model, required for auto-magic immutability
 *
 * @param opts
 * @returns {function(any): undefined}
 * @constructor
 */
export function Model(opts = {}) {
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
export function Property(opts = {}) {
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
export interface ConcreteTypeOf<T> extends Function {
	new (props?:any): T;
}


/**
 * Mutator function type
 */
export type Mutator<T> = (obj:T) => T

export class TypeWrapper<T, TType extends ConcreteTypeOf<T>> {


	constructor(private _type: new () => T, dupe: TType = undefined) {}


	get asType(): T {
		return <any>this._type;
	}


	get asStaticType(): TType {
		return <any>this._type;
	}


	mixType<Z, ZType extends new () => Z> (
		t: ConcreteTypeOf<Z>,
		dupe: ZType = undefined
	): TypeWrapper<T & Z, ConcreteTypeOf<T & Z> & TType & ZType>  {


		return <any>this;
	}




}


/**
 * Immutable class wrapper
 */
export class ImmutableBaseObject<T extends any,TT extends any> {


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

	constructor()
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
		// const tw = new TypeWrapper(modelClazz)
		// 	.mixType(ImmutableBaseObject)

		//this._type = tw.asType
		//this._type = this as any

		if (!this.record)
			this.record = new recordType(props)

	}

	// get type() {
	// 	return this._type
	// }

	get type() {
		return typeof this.typeClazz
	}

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

	set(propertyKey,newValue):TT {
		return this.withMutation(instance => {

			instance[propertyKey] = newValue
			return instance
		}) as any
	}

	clone(newRecord = null) {
		const newInstance = new this.finalClazz()
		// 	Object.create(
		// 	(<any>this).__proto__
		// ) as this

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
 * @returns {modelClazz & ImmutableBaseObject<T>}
 */
export function makeImmutable<T extends Object>(modelClazz:{new():T}) {


	const typeWrapper = new TypeWrapper(modelClazz,modelClazz)
		.mixType(ImmutableBaseObject,ImmutableBaseObject)

	type ComposedType = typeof typeWrapper.asType
	type ConcreteComposedType = ConcreteTypeOf<ImmutableBaseObject<T,ComposedType> & T>

	function makeClazz() {

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
		const newClazz = class extends ImmutableBaseObject<T,ComposedType> {
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

				newClazz.prototype['set' + toProperCase(propName)] =
					function (newVal) {
						return this.set(propName, newVal)
					}

				Object.defineProperty(newClazz.prototype, propName, {
					configurable: false,
					get: function () {
						return (this.isMutable) ? this.recordMutating[propName] : this.record[propName]
					},

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


	return makeClazz() as ConcreteComposedType
}
