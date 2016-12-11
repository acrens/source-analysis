/**
 * zepto 模块之 callbacks
 */
(function($) {
	$.Callbacks = function(options) {
		options = $.extend({}, options);

		var memory,
			fired,
			firing,
			firingStart,
			firingLength,
			firingIndex,
			list = [],
			stack = !options.once && [],
			fire = function(data) {
				memory = options.memory && data;
				fired = true;
				firingIndex = firingStart || 0;
				firingStart = 0;
				firingLength = list.length;
				firing = true;

				for(; list && firingIndex < firingLength; ++firingIndex) {

					if(list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
						memory = false;
						break;
					}
				}
				firing = false;

				if(list) {

					if(stack) {
						stack.length && fire(stack.shift());
					} else if (memory) {
						list.length = 0;
					} else {
						Callbacks.disable();
					}
				}
			},
			Callbacks = {
				add: function() {

					if(list) {
						var start = list.length,
							add = function(args) {
								$.each(args, function(_, arg) {

									if(typeof arg === 'function') {

										if(!options.unique || !Callbacks.has(arg)) {
											list.push(arg);
										}
									} else if (arg && arg.length && typeof arg !== 'string') {
										add(arg);
									}
								});
							}
						add(arguments);

						if(firing) {
							firingLength = list.length;
						} else if (memory) {
							firingStart = start;
							fire(memory);
						}
					}

					return this;
				},
				remove: function() {

					if(list) {
						$.each(arguments, function(_, arg) {
							var index;
							while((index = $.isArray(arg, list, index)) > -1) {
								list.splice(index, 1);

								if(firing) {

									if(index <= firingLength) {
										--firingLength;
									}

									if(index <= firingIndex) {
										--firingIndex;
									}
								}
							}
						});
					}

					return this;
				},
				has: function(fn) {
					return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length));
				},
				empty: function() {
					firingLength = list.length = 0;
					return this;
				},
				disable: function() {
					list = stack = memory = undefined;
					return this;
				},
				disabled: function() {
					return !list;
				},
				lock: function() {
					stack = undefined;

					if(!memory) {
						Callbacks.disable();
					}

					return this;
				},
				locked: function() {
					return !stack;
				},
				fireWith: function(context, args) {

					if(list && (!fired || stack)) {
						args = args || [];
						args = [context, args.slice ? args.slice() : args];

						if(firing) {
							stack.push(args);
						} else {
							fire(args);
						}
					}

					return this;
				},
				fire: function() {
					return Callbacks.fireWith(this, arguments);
				},
				fired: function() {
					return !!fired;
				}
			}

		return Callbacks;
	};
})(Zepto);