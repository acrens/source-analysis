/**
 * zepto 模块之 ie
 */
(function() {

	// 增加支持桌面的 Internet Explorer 10+ 和 Windows Phone 8
	// jQuery的CSS()方法，其底层运作就应用了 getComputedStyle 以及 getPropertyValue方法
	try {
		getComputedStyle(undefined);
	} catch(e) {
		var nativeGetComputedStyle = getComputedStyle;
		window.getComputedStyle = function(element, pseudoElement) {
			try {
				return nativeGetComputedStyle(element, pseudoElement);
			} catch(e) {
				return null;
			}
		}
	}
})();