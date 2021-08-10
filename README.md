# iec-61131-3

[![npm version](https://img.shields.io/npm/v/iec-61131-3)](https://www.npmjs.org/package/iec-61131-3)
[![GitHub](https://img.shields.io/badge/View%20on-GitHub-brightgreen)](https://github.com/jisotalo/iec-61131-3)
[![License](https://img.shields.io/github/license/jisotalo/iec-61131-3)](https://choosealicense.com/licenses/mit/)

IEC 61131-3 PLC data type helper for Node.js. Allows creating PLC data type schemas in Javascript and conversion between Javascript objects and raw binary PLC data. 

Supports automatic conversion from PLC code variable declarations to IEC types.

Inspiration from [iecstruct](https://www.npmjs.com/package/iecstruct) project, however written from scratch.


# Project status

This project is in early stage. It will still change a lot. There are also situations where strange error could be thrown (work in progress).

Things to do
- Adding more examples
- Using this library with CODESYS systems
- Adding ENUM support
- Updating fromString() to support ENUMs and CONSTANTs (for constant sized arrays)
- Adding supports for different pack-modes (now only pack-mode 1)
- Adding checks if Node.js version has BigInt support
- Adding more error checking



# Table of contents
- [Installing](#installing)
- [IMPORTANT NOTE](#important-note)
- [Examples](#examples)
  * [Manually providing the data types](#manually-providing-the-data-types)
  * [Automatic conversion from PLC declaration](#automatic-conversion-from-plc-declaration)
    + [Single struct](#single-struct)
    + [Multiple structs - Providing all data types at once](#multiple-structs---providing-all-data-types-at-once)
    + [Multiple structs - Providing data types separately](#multiple-structs---providing-data-types-separately)
- [License](#license)

# Installing
Install the [npm package](https://www.npmjs.com/package/iec-61131-3) using npm command:
```bash
npm i iec-61131-3
```

# IMPORTANT NOTE
The PLC data has to be saved in **pack-mode 1** so there will be no padding bytes.

In CODESYS based systems (TwinCAT etc.), add the following above `STRUCT` definitions:

`{attribute 'pack_mode' := '1'}`


# Examples

## Manually providing the data types

**Note:** This example does not care how to data is written or read. It's left out of this example.


The PLC struct definitions are as follows:
```
{attribute 'pack_mode' := '1'}
TYPE ST_IEC_Example :
STRUCT
	Text 		: STRING(50) := 'Hello iec-61131-3 helper';
	Decimal 	: REAL := 3.14159265359;
	ArrayData	: ARRAY[0..9] OF INT := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	StructData	: ST_IEC_Example2;
END_STRUCT
END_TYPE
```
```
{attribute 'pack_mode' := '1'}
TYPE ST_IEC_Example2 :
STRUCT
	Text 		: STRING(50) := 'Cheers from second struct';
END_STRUCT
END_TYPE

```

Javascript code:
```js
const iec = require('iec-61131-3')

//Creating a IEC data type schema matchin PLC datatype ST_Example
const ST_Example = iec.STRUCT({
  Text: iec.STRING(50),
  Decimal: iec.REAL,
  ArrayData: iec.ARRAY(iec.INT, 10),
  StructData: iec.STRUCT({
    Text: iec.STRING(50),
  })
})

//Creating a default empty object from it
const obj = ST_Example.getDefault()
console.log(obj)
/*
  {
    Text: '',
    Decimal: 0,
    ArrayData: [
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ],
    StructData: { Text: '' }
  }
*/

//Changing some values
obj.Text = 'Whats up?'
obj.ArrayData[5] = 123
obj.StructData.Text = 'Hello'

console.log(obj)
/*
  {
    Text: 'Whats up?',
    Decimal: 0,
    ArrayData: [
        0, 0, 0, 0, 0,
      123, 0, 0, 0, 0
    ],
    StructData: { Text: 'Hello' }
  }
*/

//Creating raw binary Buffer data
const buffer = ST_Example.convertToBuffer(obj)
console.log(buffer)
/*
  <Buffer 57 68 61 74 73 20 75 70 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... 76 more bytes>
*/

//Converting back to Javascript object
const converted = ST_Example.convertFromBuffer(buffer)
console.log(converted)
/*
  {
    Text: 'Whats up?',
    Decimal: 0,
    ArrayData: [
        0, 0, 0, 0, 0,
      123, 0, 0, 0, 0
    ],
    StructData: { Text: 'Hello' }
  }
*/
```


## Automatic conversion from PLC declaration

**Note:** This example does not care how to data is written or read. It's left out of this example.

### Single struct

Copypaste PLC struct declaration into the `fromString()` method input parameter.

```js
const iec = require('iec-61131-3')

//Copypasted directly from from PLC
//Initial values, comments and pragmas do not matter
const ST_IEC_Example = iec.fromString(`
  {attribute 'pack_mode' := '1'}
  TYPE ST_IEC_Example :
  STRUCT
    Text 				: STRING(50) := 'Hello iec-61131-3 helper';
    Decimal 			: REAL := 3.14159265359;
    ArrayData			: ARRAY[0..9] OF INT := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    MultiDimArrayData	: ARRAY[0..1, 0..2] OF INT := [1, 2, 3, 4, 5, 6];
  END_STRUCT
  END_TYPE
`)

//IEC data type schema
console.log(ST_IEC_Example)
/*
STRUCT {
  type: 'STRUCT',
  byteLength: 87,
  children: {
    Text: STRING { type: 'STRING', byteLength: 51 },
    Decimal: REAL { type: 'REAL', byteLength: 4 },
    ArrayData: ARRAY {
      type: 'ARRAY',
      byteLength: 20,
      dimensions: [Array],
      totalSize: 10,
      dataType: [INT]
    },
    MultiDimArrayData: ARRAY {
      type: 'ARRAY',
      byteLength: 12,
      dimensions: [Array],
      totalSize: 6,
      dataType: [INT]
    }
  }
}
*/


//Empty object
let obj = ST_IEC_Example.getDefault()
console.log(obj)
/*
{
  Text: '',
  Decimal: 0,
  ArrayData: [
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0
  ],
  MultiDimArrayData: [ [ 0, 0, 0 ], [ 0, 0, 0 ] ]
}
*/


//Updating data + converting to bytes
obj.Text = 'Whats up?'
obj.MultiDimArrayData[0][1] = 123

const buffer = ST_IEC_Example.convertToBuffer(obj)
console.log(buffer)
/*
<Buffer 57 68 61 74 73 20 75 70 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... 37 more bytes>
*/


//Converting back to object
obj = ST_IEC_Example.convertFromBuffer(buffer)
console.log(obj)
/*
{
  Text: 'Whats up?',
  Decimal: 0,
  ArrayData: [
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0
  ],
  MultiDimArrayData: [ [ 0, 123, 0 ], [ 0, 0, 0 ] ]
}
*/

```

### Multiple structs - Providing all data types at once

Copypaste all PLC struct declarations into the `fromString()` method input parameter. The order in the structs appear doesn't matter. 

**NOTE:** As there are multiple `STRUCT` declarations, the top-level data type needs to be given as 2nd parameter. Otherwise the method would throw an error. When there is only one struct declaration, the 2nd parameter can be omitted.

In this case, we want the schema to the `ST_IEC_Example2` data type, so we give it as 2nd parameter.


```js
const iec = require('iec-61131-3')

//Copypasted directly from from PLC
//Initial values, comments and pragmas do not matter

//NOTE: Multiple struct definitions -> order doesn't matter
//NOTE: We need to provide top-level data type as 2nd parameter!
const ST_IEC_Example2 = iec.fromString(`
  {attribute 'pack_mode' := '1'}
  TYPE ST_IEC_Example :
  STRUCT
    Text 				: STRING(50) := 'Hello iec-61131-3 helper';
    Decimal 			: REAL := 3.14159265359;
    ArrayData			: ARRAY[0..9] OF INT := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    MultiDimArrayData	: ARRAY[0..1, 0..2] OF INT := [1, 2, 3, 4, 5, 6];
  END_STRUCT
  END_TYPE

  {attribute 'pack_mode' := '1'}
  TYPE ST_IEC_Example2 :
  STRUCT
    Text 		: STRING(50) := 'Cheers from second struct';
    StructArray	: ARRAY[0..1] OF ST_IEC_Example;
  END_STRUCT
  END_TYPE

`, 'ST_IEC_Example2') //Note the 2nd parameter

//IEC data type schema
console.log(ST_IEC_Example2)
/*
STRUCT {
  type: 'STRUCT',
  byteLength: 225,
  children: {
    Text: STRING { type: 'STRING', byteLength: 51 },
    StructArray: ARRAY {
      type: 'ARRAY',
      byteLength: 174,
      dimensions: [Array],
      totalSize: 2,
      dataType: [STRUCT]
    }
  }
}
*/


//Empty object
let obj = ST_IEC_Example2.getDefault()
console.log(obj)
/*
{
  Text: '',
  StructArray: [
    {
      Text: '',
      Decimal: 0,
      ArrayData: [Array],
      MultiDimArrayData: [Array]
    },
    {
      Text: '',
      Decimal: 0,
      ArrayData: [Array],
      MultiDimArrayData: [Array]
    }
  ]
}
*/


//Updating data + converting to bytes
obj.Text = 'Whats up?'
obj.StructArray[0].Text = 'Changing value from struct under array'

const buffer = ST_IEC_Example2.convertToBuffer(obj)
console.log(buffer)
/*
<Buffer 57 68 61 74 73 20 75 70 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... 175 more bytes>
*/


//Converting back to object
obj = ST_IEC_Example2.convertFromBuffer(buffer)
console.log(obj)
/*
{
  Text: 'Whats up?',
  StructArray: [
    {
      Text: 'Changing value from struct under array',
      Decimal: 0,
      ArrayData: [Array],
      MultiDimArrayData: [Array]
    },
    {
      Text: '',
      Decimal: 0,
      ArrayData: [Array],
      MultiDimArrayData: [Array]
    }
  ]
}
*/

```

### Multiple structs - Providing data types separately

Create separate IEC data type schema for each `STRUCT` using `fromString()` method. In this case, the order is important as the `ST_IEC_Example2` needs to know the data type `ST_IEC_Example` (so it needs to be created first).

We provide the `ST_IEC_Example` IEC data type in object that is passed as 3rd parameter for the `fromString()` method. We also need to pass the top-level data type as 2nd parameter even though there is only one struct declaration.

```js
const iec = require('iec-61131-3')

//Copypasted directly from from PLC
//Initial values, comments and pragmas do not matter
const ST_IEC_Example = iec.fromString(`
  {attribute 'pack_mode' := '1'}
  TYPE ST_IEC_Example :
  STRUCT
    Text 				: STRING(50) := 'Hello iec-61131-3 helper';
    Decimal 			: REAL := 3.14159265359;
    ArrayData			: ARRAY[0..9] OF INT := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    MultiDimArrayData	: ARRAY[0..1, 0..2] OF INT := [1, 2, 3, 4, 5, 6];
  END_STRUCT
  END_TYPE
`)

//NOTE: 2nd and 3rd parameter
const ST_IEC_Example2 = iec.fromString(`
  {attribute 'pack_mode' := '1'}
  TYPE ST_IEC_Example2 :
  STRUCT
    Text 		: STRING(50) := 'Cheers from second struct';
    StructArray	: ARRAY[0..1] OF ST_IEC_Example;
  END_STRUCT
  END_TYPE`,
  'ST_IEC_Example2',
  { ST_IEC_Example } //NOTE: Providing schema for ST_IEC_Example
)

//The rest works 1:1 the same as previous example

//IEC data type schema
console.log(ST_IEC_Example2)
/*
STRUCT {
  type: 'STRUCT',
  byteLength: 225,
  children: {
    Text: STRING { type: 'STRING', byteLength: 51 },
    StructArray: ARRAY {
      type: 'ARRAY',
      byteLength: 174,
      dimensions: [Array],
      totalSize: 2,
      dataType: [STRUCT]
    }
  }
}
*/


//Empty object
let obj = ST_IEC_Example2.getDefault()
console.log(obj)
/*
{
  Text: '',
  StructArray: [
    {
      Text: '',
      Decimal: 0,
      ArrayData: [Array],
      MultiDimArrayData: [Array]
    },
    {
      Text: '',
      Decimal: 0,
      ArrayData: [Array],
      MultiDimArrayData: [Array]
    }
  ]
}
*/


//Updating data + converting to bytes
obj.Text = 'Whats up?'
obj.StructArray[0].Text = 'Changing value from struct under array'

const buffer = ST_IEC_Example2.convertToBuffer(obj)
console.log(buffer)
/*
<Buffer 57 68 61 74 73 20 75 70 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... 175 more bytes>
*/


//Converting back to object
obj = ST_IEC_Example2.convertFromBuffer(buffer)
console.log(obj)
/*
{
  Text: 'Whats up?',
  StructArray: [
    {
      Text: 'Changing value from struct under array',
      Decimal: 0,
      ArrayData: [Array],
      MultiDimArrayData: [Array]
    },
    {
      Text: '',
      Decimal: 0,
      ArrayData: [Array],
      MultiDimArrayData: [Array]
    }
  ]
}
*/

```

# License

Licensed under [MIT License](http://www.opensource.org/licenses/MIT) so commercial use is possible. Please respect the license, linking to this page is also much appreciated.

Copyright (c) 2021 Jussi Isotalo <<j.isotalo91@gmail.com>>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
