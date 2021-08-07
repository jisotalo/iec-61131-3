# iec-61131-3

[![npm version](https://img.shields.io/npm/v/iec-61131-3)](https://www.npmjs.org/package/iec-61131-3)
[![GitHub](https://img.shields.io/badge/View%20on-GitHub-brightgreen)](https://github.com/jisotalo/iec-61131-3)
[![License](https://img.shields.io/github/license/jisotalo/iec-61131-3)](https://choosealicense.com/licenses/mit/)

IEC 61131-3 PLC data type helper for Node.js. Allows creating PLC data type schemas in Javascript and conversion between Javascript objects and raw binary PLC data.

Inspiration from [iecstruct](https://www.npmjs.com/package/iecstruct) project, however written from scratch.


# Project status

Things to do
- Adding automatic conversion from PLC code
- Adding supports for different pack-modes (now only pack-mode 1)
- Adding checks if Node.js version has BigInt support



# Table of contents
- [Installing](#installing)
- [IMPORTANT NOTE](#important-note)
- [Simple example](#simple-example)
- [License](#license)


# Installing
Install the [npm package](https://www.npmjs.com/package/iec-61131-3) using npm command:
```bash
npm i iec-61131-3
```

# IMPORTANT NOTE
At the moment, the PLC data has to be saved in **pack-mode 1** so there will be no padding bytes.

In CODESYS based systems (TwinCAT etc.), add the following above `STRUCT` definitions:

`{attribute 'pack_mode' := '1'}`

# Simple example

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
