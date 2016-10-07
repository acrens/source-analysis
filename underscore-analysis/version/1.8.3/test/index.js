/**
 * 测试手动编写的 underscore.js
 */

var data = [{
    number: 3,
    name: 'james',
    age: 31
}, {
    number: 1,
    name: 'acrens',
    age: 24
}, {
    number: 100,
    name: 'iversion',
    age: 11
}];

// 以 number 排序
data = _.sortBy(data, 'number');

// 渲染内容
var tpl = _.template(document.getElementById('J-init-tpl').text, { data: data })();
document.getElementById('J-init-node').innerHTML = tpl;