/**
 * zepto 模块之 ie
 */
(function() {

	// 增加支持桌面的Internet Explorer 10+和Windows Phone 8
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