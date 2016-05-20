const log = getLogger(__filename)

import {
	Model,
	Property,
	makeImmutable
} from '../util/TypeTools'

describe('#typetools',() => {
	it('#mix-types-pass-instanceof',() => {



		@Model()
		class MyModel {

			@Property()
			prop323242:string = 'test'

			@Property()
			val3242:number = 5

			myMethod() {
				log.info('my method = ' + this.val3242 + '/' +
					this.prop323242)
			}
		}

		const MyPersistentModel = makeImmutable(MyModel)
		const o = new MyPersistentModel()
		expect(o instanceof MyPersistentModel).to.be.true
		expect(o.val3242 === 5).to.be.true
		
		expect(() => {
			o.val3242 = 10
		}).to.throw(Error)

		const o2 = o.set('val3242',10)
		expect(o2 instanceof MyPersistentModel).to.be.true
		expect(o2.val3242 === 10).to.be.true

		o.myMethod()
		o2.myMethod()


		// Manual Mutation
		const o3 = o2.withMutation(o2Mutable => {
			o2Mutable.val3242 = 15

			return o2Mutable
		})

		expect(o !== o2 !== o3).to.be.true


		expect(o3.val3242 === 15).to.be.true

	})
})