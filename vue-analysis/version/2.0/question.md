### import 没有括号与有括号的区别，如：import a from '', import {a} from ''
    - ES6 将一个文件视为一个模块，因此外部直接是访问不到文件里面定义的变量，需要通过 export 导出变量，import 导入变量；
    - import 使用大括号导入的变量名必须要在对应的文件里通过 export 导出了对外的同名接口；
    - import 不通过大括号导入变量，变量名可以随便取，到对应的导入是 export default 对外导出的接口；
    - import * as obj from '' 导入所有模块赋值在obj对象上；
    - 使用 export default 后面不能使用变量声明字样，如：export default let a = 1；
    - export default 42 解读：将值赋给 default，所以正确;

### Object.defineProperty 作用
    - 三个参数，第一个被扩展对象，第二个新增加的属性，第三个对新增加属性的内容描述，如：Object.defineProperty({}, 'a', {value: 123, writable: true})
    - 通过 Object.defineProperty 可以实现数据视图联动，读取及调用分别会调用get/set函数；
    