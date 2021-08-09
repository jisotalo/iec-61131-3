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

import * as types from './iec-types'
import { resolveIecStructs } from './iec-resolver'

/**
 * IEC 61131-3 type: STRUCT
 * Provide struct children as object
 */
export const STRUCT = (children: StructChildren): types.STRUCT => new types.STRUCT(children)

/**
 * IEC 61131-3 type: ARRAY
 * Handles 1..3 dimensional arrays
 *
 * @param dataType Data type of the array (example: iec.INT)
 * @param dimensions If 1-dimensional array: Array dimension (size) as number. If multi-dimensional array, array dimensions as array (like [1, 10, 5])
 */
export const ARRAY = (dataType: IecType, dimensions: number | number[]): types.ARRAY => new types.ARRAY(dataType, dimensions)

/**
 * IEC 61131-3 type: STRING
 * Default length 80 characters
 * @param length Length of the string variable (similar as in the PLC), default is 80
 */
export const STRING = (length?: number): types.STRING => new types.STRING(length)

/**
 * IEC 61131-3 type: WSTRING
 * Default length 80 characters
 * @param length Length of the string variable (similar as in the PLC), default is 80
 */
export const WSTRING = (length?: number): types.WSTRING => new types.WSTRING(length)

/**
 * IEC 61131-3 type: BOOL (1 byte)
 */
export const BOOL = new types.BOOL()

/**
 * IEC 61131-3 type: USINT (1 byte)
 */
export const USINT = new types.USINT()

/**
 * IEC 61131-3 type: BYTE (1 byte)
 */
export const BYTE = new types.BYTE()

/**
 * IEC 61131-3 type: SINT (1 byte)
 */
export const SINT = new types.SINT()


/**
 * IEC 61131-3 type: UINT (2 bytes)
 */
export const UINT = new types.UINT()

/**
 * IEC 61131-3 type: WORD (2 bytes)
 */
export const WORD = new types.WORD()

/**
 * IEC 61131-3 type: INT (2 bytes)
 */
export const INT = new types.INT()


/**
 * IEC 61131-3 type: DINT (4 bytes)
 */
export const DINT = new types.DINT()

/**
 * IEC 61131-3 type: UDINT (4 bytes)
 */
export const UDINT = new types.UDINT()

/**
 * IEC 61131-3 type: DWORD (4 bytes)
 */
export const DWORD = new types.DWORD()

/**
 * IEC 61131-3 type: TIME (4 bytes)
 */
export const TIME = new types.TIME()

/**
 * IEC 61131-3 type: TOD (4 bytes)
 */
export const TOD = new types.TOD()

/**
 * IEC 61131-3 type: TIME_OF_DAY (4 bytes)
 */
export const TIME_OF_DAY = new types.TIME_OF_DAY()

/**
 * IEC 61131-3 type: DT (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export const DT = new types.DT()

/**
 * IEC 61131-3 type: DATE_AND_TIME (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export const DATE_AND_TIME = new types.DATE_AND_TIME()

/**
 * IEC 61131-3 type: DATE (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export const DATE = new types.DATE()


/**
 * IEC 61131-3 type: REAL (4 bytes)
 */
export const REAL = new types.REAL()

/**
 * IEC 61131-3 type: LREAL (4 bytes)
 */
export const LREAL = new types.LREAL()


/**
 * IEC 61131-3 type: ULINT (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export const ULINT = new types.ULINT()

/**
 * IEC 61131-3 type: LWORD (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export const LWORD = new types.LWORD()

/**
 * IEC 61131-3 type: LINT (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export const LINT = new types.LINT()


/**
 * Available non-complex IEC types
 */
export const nonComplexTypes = [
  BOOL,
  USINT,
  BYTE,
  SINT,
  UINT,
  WORD,
  INT,
  DINT,
  UDINT,
  DWORD,
  TIME,
  TOD,
  TIME_OF_DAY,
  DT,
  DATE_AND_TIME,
  DATE,
  REAL,
  LREAL,
  ULINT,
  LWORD,
  LINT
]




/**
 * Converts given IEC structure declaration(s) to data type. 
 * If only one struct declaration given, it's selected automatically.
 * If multiple given, top-level type needs to be given as 2nd parameter.
 * 
 * @param declarations PLC IEC-61131-3 struct type declarations (one or multiple)
 * @param topLevelDataType If multiple struct type declarations given, the top-level struct type name needs to be provided (= which struct should be returned as IEC type)
 * @param providedTypes Object containing struct data type names and their IEC types if required (if some structs are defined somewhere else) - like {'ST_Example': STRUCT(...)}
 * @returns 
 */
export const fromString = (declarations: string, topLevelDataType?: string, providedTypes?: Record<string, IecType>): IecType => {
  return resolveIecStructs(declarations, topLevelDataType, providedTypes)
}




 