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

import util from 'util'

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


const availableTypes = [/*
  STRUCT,
  ARRAY,
  STRING,
  WSTRING,*/
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




export const fromString = (declaration: string, topLevelType?: string, providedTypes?: Record<string, IecType>): IecType => {

  const regEx = new RegExp(/type\s*(\w*)\s*:(.*?)end_type/gis)

  const parsed = []

  let match
  while ((match = regEx.exec(declaration)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === regEx.lastIndex) {
      regEx.lastIndex++;
    }

    const res = {
      dataType: match[1],
      children: parseVariables(match[2]),
      resolved: null,
      resolvers: [] as Array<() => void>
    }

    parsed.push(res)
  }

  //Converting to IEC types
  if (!topLevelType && parsed.length > 1) {
    throw new Error('Top level data type name (topLevelType) is not given and many struct declarations found. Not possible to guess.')

  } else if (!topLevelType) {
    topLevelType = parsed[0].dataType
  }
/*
  console.log(topLevelType)
  
  console.log(util.inspect(parsed, undefined, 999))
*/
  const stringRegEx = new RegExp('^(STRING|WSTRING)([\\[\\(](.*?)[\\)\\]])*$', 'i')
  const arrayRegEx = new RegExp(/array\s*[\[(]+(.*?)\s*\.\.\s*(.*?)[\])]\s*of\s*([^:;]*)/gis)

  for (const type of parsed) {
    const obj = {} as Record<string, IecType>
    
    for (const child of type.children) {


      //Simple data type
      let type = availableTypes.find(t => t.type.toLowerCase() === child.dataType.toLowerCase())

      if (type) {
        obj[child.name] = type
        continue
      }


      //String or wstring
      const stringMatch = stringRegEx.exec(child.dataType)//child.dataType.match(stringRegEx)
      if (stringMatch) {
        //console.log('string', stringMatch)
        if (stringMatch[1].toLowerCase() === 'string') {
          obj[child.name] = STRING(stringMatch[3] ? parseInt(stringMatch[3]) : 80)

        } else if (stringMatch[1].toLowerCase() === 'wstring') {
          obj[child.name] = WSTRING(stringMatch[3] ? parseInt(stringMatch[3]) : 80)
        }
        continue
      }

      //console.log('not regular', child.dataType)

      //Array
      const arrayMatch = arrayRegEx.exec(child.dataType)
      if (arrayMatch) {
        //console.log('array', arrayMatch)
        
        //Todo: Array of structs etc, strings etc.
        type = availableTypes.find(t => t.type.toLowerCase() === arrayMatch[3].toLowerCase())

        if (!type) {
          throw new Error(`Unknown array subtype ${arrayMatch[3]}`)
        }

        //console.log(arrayMatch)

        obj[child.name] = ARRAY(type, parseInt(arrayMatch[2]) - parseInt(arrayMatch[1]) + 1)
        continue
      }


      //Struct (or unknown)
      const struct = parsed.find(p => p.dataType.toLowerCase() == child.dataType.toLowerCase())

      if (struct) {
        if (struct.resolved) {
          obj[child.name] = struct.resolved

        } else {
          //To be resolved later (struct not parsed yet), add resolver callback
          struct.resolvers.push(() => {
            obj[child.name] = STRUCT(struct.resolved)
          })
        }
        
      } else {
        //Are there any types provided?
        if (providedTypes) {
          const key = Object.keys(providedTypes).find(key => key.toLowerCase() === child.dataType.toLowerCase())

          if (key) {
            obj[child.name] = providedTypes[key]
          } else {
            throw new Error(`Unknown subtype ${child.dataType} - Is data type declaration provided? Types found: ${parsed.map(p => p.dataType).join(', ')}, types provided: ${Object.keys(providedTypes).join(',')}`)
          }
          
        } else {
          throw new Error(`Unknown subtype ${child.dataType} - Is data type declaration provided? Types found: ${parsed.map(p => p.dataType).join(', ')}`)
        }
      }
    }

    //console.log(`Object now resolved:`, obj)

    type.resolved = obj
    type.resolvers.forEach(resolver => resolver())
    type.resolvers = []

  }

  const final = parsed.find(p => p.dataType.toLowerCase() === topLevelType?.toLowerCase())

  if (!final) {
    throw new Error(`Top-level type ${topLevelType} was not found - Is data type declaration provided? Types found: ${parsed.map(p=>p.dataType).join(', ')}`)
  }

  return STRUCT(final.resolved)
}





const parseVariables = (declaration: string) => {
  const regEx = new RegExp(/(\w+)\s*:\s*([^:;]*)/gis)

  const parsed = []

  //console.log(declaration)
  let match
  while ((match = regEx.exec(declaration)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === regEx.lastIndex) {
      regEx.lastIndex++;
    }

    const res = {
      name: match[1],
      dataType: match[2].trim()
    }

    parsed.push(res)
  }

  return parsed

}
 