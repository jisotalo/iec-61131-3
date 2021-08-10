/*
https://github.com/jisotalo/iec-61131-3

Copyright (c) 2021 Jussi Isotalo <j.isotalo91@gmail.com>

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
*/

import type {
  IecType,
  StructChildren
} from './types/types'

import * as handler from './iec-type-handler'

/**
 * IEC 61131-3 type: STRUCT
 * Provide struct children as object
 */
export const STRUCT = (children: StructChildren): handler.STRUCT => new handler.STRUCT(children)

/**
 * IEC 61131-3 type: ARRAY
 * Handles 1..3 dimensional arrays
 *
 * @param dataType Data type of the array (example: iec.INT)
 * @param dimensions If 1-dimensional array: Array dimension (size) as number. If multi-dimensional array, array dimensions as array (like [1, 10, 5])
 */
export const ARRAY = (dataType: IecType, dimensions: number | number[]): handler.ARRAY => new handler.ARRAY(dataType, dimensions)

/**
 * IEC 61131-3 type: STRING
 * Default length 80 characters
 * @param length Length of the string variable (similar as in the PLC), default is 80
 */
export const STRING = (length?: number): handler.STRING => new handler.STRING(length)

/**
 * IEC 61131-3 type: WSTRING
 * Default length 80 characters
 * @param length Length of the string variable (similar as in the PLC), default is 80
 */
export const WSTRING = (length?: number): handler.WSTRING => new handler.WSTRING(length)

/**
 * IEC 61131-3 type: BOOL (1 byte)
 */
export const BOOL = new handler.BOOL()

/**
 * IEC 61131-3 type: USINT (1 byte)
 */
export const USINT = new handler.USINT()

/**
 * IEC 61131-3 type: BYTE (1 byte)
 */
export const BYTE = new handler.BYTE()

/**
 * IEC 61131-3 type: SINT (1 byte)
 */
export const SINT = new handler.SINT()


/**
 * IEC 61131-3 type: UINT (2 bytes)
 */
export const UINT = new handler.UINT()

/**
 * IEC 61131-3 type: WORD (2 bytes)
 */
export const WORD = new handler.WORD()

/**
 * IEC 61131-3 type: INT (2 bytes)
 */
export const INT = new handler.INT()


/**
 * IEC 61131-3 type: DINT (4 bytes)
 */
export const DINT = new handler.DINT()

/**
 * IEC 61131-3 type: UDINT (4 bytes)
 */
export const UDINT = new handler.UDINT()

/**
 * IEC 61131-3 type: DWORD (4 bytes)
 */
export const DWORD = new handler.DWORD()

/**
 * IEC 61131-3 type: TIME (4 bytes)
 */
export const TIME = new handler.TIME()

/**
 * IEC 61131-3 type: TOD (4 bytes)
 */
export const TOD = new handler.TOD()

/**
 * IEC 61131-3 type: TIME_OF_DAY (4 bytes)
 */
export const TIME_OF_DAY = new handler.TIME_OF_DAY()

/**
 * IEC 61131-3 type: DT (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export const DT = new handler.DT()

/**
 * IEC 61131-3 type: DATE_AND_TIME (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export const DATE_AND_TIME = new handler.DATE_AND_TIME()

/**
 * IEC 61131-3 type: DATE (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export const DATE = new handler.DATE()


/**
 * IEC 61131-3 type: REAL (4 bytes)
 */
export const REAL = new handler.REAL()

/**
 * IEC 61131-3 type: LREAL (4 bytes)
 */
export const LREAL = new handler.LREAL()


/**
 * IEC 61131-3 type: ULINT (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export const ULINT = new handler.ULINT()

/**
 * IEC 61131-3 type: LWORD (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export const LWORD = new handler.LWORD()

/**
 * IEC 61131-3 type: LINT (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export const LINT = new handler.LINT()






 