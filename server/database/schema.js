
/**
 * Schema
 * --------
 * 
 * 后端的schema主要用来创建这样几种数据：
 * 
 * 1. 表的定义，包括表的字段、表所允许的操作等等
 * 
 * 2. 页面的定义
 * 
 * 3. 表中的form类型，比如函证中的函证状态。
 * 
 * schema的最终表达是一个级联的JSON兼容对象。我们基于schema所创建的对象也应该是
 * 兼容JSON的对象。因此schema中支持的表达式包含以下几类：
 * 
 * 1. 基础数据类型，包括string, number等所有可以通过typeof区分的
 * 
 * 2. 选项类型，是通过一个Array of strings来表示的，选项类型总是允许多选及空置。
 * 
 * 3. 列表，列表类型中的数据必须一致。实际创建数据时会检查列表的类型。
 * 
 */

const validate = (data, type) => {

  if (typeof type === 'string' && typeof data === type){

    return {ok: true, type: 'prim'};
  
  } else if (Array.isArray(type) && type.length === 1){

    const innerType = type[0];
    const subs = data.map((innerElem) => validate(innerElem, innerType));
    const ok = subs.every(({ok}) => ok);

    return { ok, subs, type: 'list'}

  } else if (type.constructor === Object){

    const subEntries = Object.entries(type).map(([k, innerType]) => {
      return [k, validate(data[k], innerType)]
    });
    const ok = subEntries.every(([,{ok}]) => ok);
    const subs = Object.fromEntries(subEntries);

    return {ok, subs, type: 'dict'};
  }

  return {error: true, type: 'unknown'}
}

const Select = (options, {allowMulti=true, allowNone=true}={}) => {
  if (options === undefined){
    throw Error('you have to explicitly specify the options Array');
  }

  return {
    type: 'select',
    allowMulti,
    allowNone,
    options
  }
}

const Map = (options, {allowUndefined=true}={}) => {
  if (options === undefined){
    throw Error('you have to explicitly specify the options array');
  }

  return {
    type: 'map',
    allowUndefined,
    options
  }
}

function Schema(schemaData) {

}

/**
 * Create record according to schema
 * -----------------
 * the Schema is for validating and filling the default value
 * 
 * @param {*} data the data you are going to create
 * @param {*} schema the schema of data
 */
const createData = (data, schema) => {

}