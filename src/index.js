'use strict';

const
	slice = Array.prototype.slice,
	epic = require('epic.util'),
	statics = new Map();



const createDescriptor = function(type, factory)
{
	let descriptor = { ctor:type};
	if (epic.typeof(factory) === 'function')
		descriptor.factory = factory;
	else
		descriptor.instance = factory;
	return descriptor;
};

const createAnnotation = function(container, factory, map)
{
	if (typeof(factory) !== 'function')
		throw new Error('Factory should be of function type.');

	return {
		as: component =>
		{
			let descriptor = createDescriptor(component, factory);
			map.set(descriptor.ctor, descriptor);
			return createTypeOptions(container, descriptor);
		},
		register: container.register,
		resolve: container.resolve
	};
};

const createTypeOptions = function(container, descriptor)
{
	return {
		singleton: () => descriptor.singleton = true,
		static: () => {descriptor.singleton = descriptor.static = true; statics.set(descriptor.ctor, descriptor);},
		register: container.register,
		resolve: container.resolve
	};
}


class Container
{
	constructor()
	{
		this.registers = new Map();
	}

	is(type)
	{
		return statics.has(type) || this.registers.has(type);
	}

	register(type, factory)
	{
		if (arguments.length === 1)
		{
			factory = type;
			type = null;

			return createAnnotation(this, factory, this.registers);
		}

		let descriptor = createDescriptor(type, factory);
		this.registers.set(descriptor.ctor, descriptor);
		return createTypeOptions(this, descriptor);
	}


	resolve(type /* args */)
	{
		let result = statics.get(type) || this.registers.get(type);
		let args = arguments.length === 1 ? null : slice.call(arguments, 1);

		if (!result)
			throw new Error(`${type} is not registered in the IoC container.`);

		if (result.instance)
			return result.instance;

		return result.singleton ? (result.instance = result.factory(this, type, args)) : result.factory(this, type, args);
	}


}


module.exports = Container; 
