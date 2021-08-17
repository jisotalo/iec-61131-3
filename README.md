# iec-61131-3

[![npm version](https://img.shields.io/npm/v/iec-61131-3)](https://www.npmjs.org/package/iec-61131-3)
[![GitHub](https://img.shields.io/badge/View%20on-GitHub-brightgreen)](https://github.com/jisotalo/iec-61131-3)
[![License](https://img.shields.io/github/license/jisotalo/iec-61131-3)](https://choosealicense.com/licenses/mit/)

IEC 61131-3 PLC data type helper for Node.js. Allows creating PLC data type schemas in Javascript and conversion between Javascript objects and raw binary PLC data. 

Supports automatic conversion from PLC code variable declarations (structs, enums, unions, aliases) to IEC types.

Inspiration from [iecstruct](https://www.npmjs.com/package/iecstruct) project, however written from scratch.


# Project status

This project is in early stage. There is still some error handling missing.

Things to do
- Adding more examples to README
- Example how to use this library with CODESYS systems
- Updating `fromString()` to support CONSTANTs (for constant sized arrays etc.)
- Adding supports for different pack-modes (now only pack-mode 1)
- Adding checks if Node.js version has BigInt support
- Adding more error checking
- Adding TypeScript type/interface definition generator



# Table of contents
- [Installing](#installing)
- [IMPORTANT NOTE](#important-note)
- [Available data types](#available-data-types)
- [Documentation](#documentation)
  * [Defining data types](#defining-data-types)
  * [Using `fromString()` automatic method](#using--fromstring----automatic-method)
- [Examples](#examples)
  * [Manually creating the data type schema](#manually-creating-the-data-type-schema)
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

# Available data types
- STRUCT
- UNION
- ARRAY
- ENUM
- STRING
- WSTRING
- BOOL
- USINT
- BYTE
- SINT
- UINT
- WORD
- INT
- DINT
- UDINT
- DWORD
- TIME
- TOD
- TIME_OF_DAY
- DT
- DATE_AND_TIME
- DATE
- REAL
- LREAL
- ULINT
- LWORD
- LINT

Also, when using `fromString()`, the ALIAS data type is supported.

# Documentation

## Defining data types

Note: It's much easier to use the `fromString()` way. See next chapter.


Including the library with the following:
```js
const iec = require('iec-61131-3')
```

**STRUCT**
```js
/*
  TYPE ST_Struct :
  STRUCT
    variable1: INT;
    variable2: REAL;
  END_STRUCT
  END_TYPE
*/
const ST_Struct = iec.STRUCT({
  variable1: iec.INT,
  variable2: iec.REAL
})
```

**UNION**

All `UNION` members occupy the same memory, so size of the `UNION` = size of the biggest variable data type.

```js
/*
  TYPE U_Union :
  UNION
    variable1: INT;
    variable2: REAL;
  END_UNION
  END_TYPE
*/
const U_Union = iec.UNION({
  variable1: iec.INT,
  variable2: iec.REAL
})
```
**ARRAY**

Single-dimensional array
```js
//singleDimension : ARRAY[0..9] OF INT;
const singleDimension = iec.ARRAY(iec.INT, 10)
```
Multi-dimensional array
```js
//multiDimension : ARRAY[0..1, 0..9] OF INT;
const multiDimension = iec.ARRAY(iec.INT, [2, 10])
```

**ENUM**

`ENUM` with default type (`INT`):
```js
/*
  TYPE E_Enum :
  (
    member0 := 0,
    member1,
    member2,
    member100 := 100
  );
  END_TYPE
*/
const E_Enum = iec.ENUM({
  member0: 0,
  member1: 1,
  member2: 2,
  member100: 100
})
```

`ENUM` with specific type (like `DWORD`):
```js
/*
  TYPE E_Enum :
  (
    member0 := 0
  ) DWORD;
  END_TYPE
*/
const E_Enum = iec.ENUM({
  member0: 0
}, iec.DWORD)
```

**STRING**

Default length (80):
```js
//stringValue : STRING;
const stringValue = iec.STRING()
```

Custom length:
```js
//stringValue : STRING(200);
const stringValue = iec.STRING(200)
```

WSTRING
Default length (80):
```js
//stringValue : WSTRING;
const wstringValue = iec.WSTRING()
```

Custom length:
```js
//stringValue : WSTRING(200);
const wstringValue = iec.WSTRING(200)
```
**BOOL**
```js
const BOOL = iec.BOOL
```
**USINT**
```js
const USINT = iec.USINT
```
**BYTE**
```js
const BYTE = iec.BYTE
```
**SINT**
```js
const SINT = iec.SINT
```
**UINT**
```js
const UINT = iec.UINT
```
**WORD**
```js
const WORD = iec.WORD
```
**INT**
```js
const INT = iec.INT
```
**DINT**
```js
const DINT = iec.DINT
```
**UDINT**
```js
const UDINT = iec.UDINT
```
**DWORD**
```js
const DWORD = iec.DWORD
```
**TIME**
```js
const TIME = iec.TIME
```
**TOD, TIME_OF_DAY**
```js
const TOD = iec.TOD
const TIME_OF_DAY = iec.TIME_OF_DAY
```
**DT, DATE_AND_TIME, DATE**

Epoch timestamp (seconds since 1970)

**IMPORTANT NOTE:** At the moment, the value is not converted to Javascript `Date` object. This might change in future updates!!
```js
const DT = iec.DT
const DATE_AND_TIME = iec.DATE_AND_TIME
const DATE = iec.DATE
```
**REAL**
```js
const REAL = iec.REAL
```
**LREAL**
```js
const LREAL = iec.LREAL
```
**ULINT**

NOTE: Requires `BigInt` support from Node.js
```js
const ULINT = iec.ULINT
```
**LWORD**

NOTE: Requires `BigInt` support from Node.js
```js
const LWORD = iec.LWORD
```
**LINT**

NOTE: Requires `BigInt` support from Node.js
```js
const LINT = iec.LINT
```

## Using `fromString()` automatic method

The PLC data type declarations (STRUCT, UNION, ENUM, ALIAS) can be automatically converted to Javascript data type schemas.

Single `STRUCT`:
```js
const ST_Struct = iec.fromString(`
  {attribute 'pack_mode' := '1'}
  TYPE ST_Struct:
    STRUCT
    variable1: INT;
  variable2: REAL;
  END_STRUCT
  END_TYPE
`)
```

Single `ENUM`:
```js
const E_Enum = iec.fromString(`
  {attribute 'qualified_only'}
  {attribute 'strict'}
  TYPE E_Enum :
  (
    member0 := 0,
    member1,
    member2,
    member100 := 100
  );
  END_TYPE
`)
```

`STRUCT` that depends on another `STRUCT` and also on `ENUM`:
```js
const ST_Struct = iec.fromString(`
  {attribute 'pack_mode' := '1'}
  TYPE ST_Struct :
  STRUCT
    StructValue: ST_Struct2;
    EnumValue: E_Enum;
  END_STRUCT
  END_TYPE

  {attribute 'pack_mode' := '1'}
  TYPE ST_Struct2 :
  STRUCT
    StringValue: STRING();
  END_STRUCT
  END_TYPE

  {attribute 'qualified_only'}
  {attribute 'strict'}
  TYPE E_Enum :
  (
    member0 := 0,
    member1,
    member2,
    member100 := 100
  );
  END_TYPE
`, 'ST_Struct') //NOTE 2nd parameter (= top-level data type / desired return value)
```

Providing already defined data types and also using `ALIAS` (`ST_Struct2` is used with alias `MyStruct2Alias`)
```js
const ST_Struct2 = iec.STRUCT({
  StringValue: iec.STRING()
})

const E_Enum = iec.ENUM({
  member0: 0,
  member1: 1,
  member2: 2,
  member100: 100
})

const ST_Struct = iec.fromString(`
  TYPE MyStruct2Alias : ST_Struct2; END_TYPE

  {attribute 'pack_mode' := '1'}
  TYPE ST_Struct :
  STRUCT
    StructValue: MyStruct2Alias;
    EnumValue: E_Enum;
  END_STRUCT
  END_TYPE`,
  'ST_Struct', //NOTE 2nd parameter (= top-level data type / desired return value)
  { ST_Struct2, E_Enum } //NOTE 3rd parameter ( = provided data types)
) 
```




# Examples

## Manually creating the data type schema

Let's assume that the PLC struct definitions are as follows:

ST_IEC_Example:
```
{attribute 'pack_mode' := '1'}
TYPE ST_IEC_Example :
STRUCT
	Text        : STRING(50) := 'Hello iec-61131-3 helper';
	Decimal     : REAL := 3.14159265359;
	ArrayData   : ARRAY[0..9] OF INT := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	StructData  : ST_IEC_Example2;
END_STRUCT
END_TYPE
```
ST_IEC_Example2:
```
{attribute 'pack_mode' := '1'}
TYPE ST_IEC_Example2 :
STRUCT
	Text  : STRING(50) := 'Cheers from second struct';
END_STRUCT
END_TYPE

```

Then we can define the same schema in Javascript code:
```js
const iec = require('iec-61131-3')

//Creating a IEC data type schema matching the PLC datatype ST_Example
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

We could also define structs separatelyindependsently:

```js
const iec = require('iec-61131-3')

//ST_Example2 schema
const ST_Example2 = iec.STRUCT({
  Text: iec.STRING(50)
})

//ST_Example schema
const ST_Example = iec.STRUCT({
  Text: iec.STRING(50),
  Decimal: iec.REAL,
  ArrayData: iec.ARRAY(iec.INT, 10),
  StructData: ST_Example2
})
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
