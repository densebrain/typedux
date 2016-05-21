const log = getLogger(__filename)

import {
	RecordModel,
	RecordProperty,
	makeImmutable,
	NotMutableError
} from '../util/TypeTools'




describe('#typetools',() => {
	let o,o2,o3,o4

	@RecordModel()
	class MyModel {

		@RecordProperty()
		prop323242:string = 'test'

		@RecordProperty()
		val3242:number = 5

		myMethod() {
			log.info('my method = ' + this.val3242 + '/' +
				this.prop323242)

			return this.val3242
		}
	}



	const MyPersistentModel = makeImmutable(MyModel)


	before(() => {
		o = new MyPersistentModel()
	})

	it('#has-default-values',() => {
		expect(o instanceof MyPersistentModel).to.be.true
		expect(o.val3242 === 5).to.be.true
	})

	it('#wont-mutate',() => {
		expect(() => {
			o.val3242 = 10
		}).to.throw(/NotMutableError/)

		expect(o.myMethod() === 5).to.be.true
	})

	it('#allows-set',() => {
		o2 = o.set('val3242', 10)
		expect(o2 instanceof MyPersistentModel).to.be.true

		expect(o !== o2).to.be.true
		expect(o2.val3242 === 10).to.be.true
		expect(o2.myMethod() === o2.val3242).to.be.true
	})

	it('#clones-identical',() => {
		let ot = o.clone()
		expect(Object.is(o.record,ot.record)).to.be.true

		ot = o.clone().withMutation(otTemp => {
			otTemp.val3242 = 15

			return otTemp
		})

		expect(Object.is(o.record,ot.record)).to.be.false

	})

	it('#supports-with-mutation',() => {

		// Manual Mutation
		o3 = o2.withMutation(o2Mutable => {
			o2Mutable.val3242 = 15

			expect(o2Mutable.val3242 === 15).to.be.true

			return o2Mutable
		})

		expect(o !== o2 !== o3).to.be.true
		expect(o3.val3242 === 15).to.be.true

	})

})