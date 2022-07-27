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


import * as types from '../iec-type-handler'


/**
 * IEC data type interface
 */
export interface IecType extends Iterable<IteratedIecType> {
  /**
   * Name of the IEC data type as string
   */
  type: string,

  /**
   * Size of the data in bytes
   */
  byteLength: number,

  /**
   * Converts given Javascript object to Buffer
   */
  /* eslint-disable @typescript-eslint/no-explicit-any*/
  convertToBuffer: (data: any) => Buffer,
  
  /**
   * Converts given Buffer data to Javascript object
   */
  convertFromBuffer: (data: Buffer) => Record<string, unknown> | unknown,

  /**
   * Returns default (empty) Javascript object representing the IEC type
   */
  getDefault: () => Record<string, unknown> | unknown

  /**
   * Children of the data type (if any)
   */
  children?: Record<string, IecType | never>

  /**
   * Iterator for looping through all variables in memory order
   * NOTE: Array variable is _one_ variable, see elementIterator() for looping each array element
   * 
   * Usage: for(const variable of dataType.variableIterator()) {...}
   * Shorthand for this is: for(const variable of dataType) {...}
   */
  variableIterator: () => IterableIterator<IteratedIecType>

  /**
   * Iterator for looping through all variables (and their array elements) in memory order
   * NOTE: Each array element is yield separately unlike with variableIterator()
   * 
   * Usage: for(const variable of dataType.elementIterator()) {...}
   * 
   */
  elementIterator: () => IterableIterator<IteratedIecType>
}


/**
 * Allowed enumeration values
 */
export type EnumValue = EnumEntry | string | number

/**
 * Enumeration value object
 */
export interface EnumEntry {
  name: string | undefined,
  value: number
}


/**
 * Possible enumeration IEC data types
 */
export type EnumDataType =
  types.USINT
  | types.BYTE
  | types.SINT
  | types.UINT
  | types.WORD
  | types.INT
  | types.DINT
  | types.UDINT
  | types.DWORD
  | types.ULINT
  | types.LWORD
  | types.LINT


/**
 * Different data type units (DUT) as enumeration
 */
export enum dataTypeUnit {
  STRUCT = 'STRUCT',
  UNION = 'UNION',
  ENUM = 'ENUM',
  ALIAS = 'ALIAS'
}

/**
 * Extracted data type unit (DUT) definition from string declaration
 * Contains extracted data for STRUCT, UNION, ENUM or ALIAS
 */
export interface ExtractedType {
  /**
   * Data type unit type (STRUCT, UNION, ENUM or ALIAS)
   */
  type: dataTypeUnit,

  /**
   * Name of the type as string (like ST_Example, E_Enum)
   */
  name: string,

  /**
   * Extracted content of the data type unit
   * Depends on type
   */
  content: ExtractedTypeVariable[] | ExtractedEnum | ExtractedAlias

  /**
   * Resolved IEC data type (undefined if not yet resolved)
   */
  resolved?: IecType,
}




/**
 * Extracted STRUCT or UNION child variable definition from string declaration
 * Example: In STRUCT "value: BOOL" --> {name: "value", dataType: "BOOL"}
 */
export interface ExtractedTypeVariable {
  /**
   * Variable name
   */
  name: string,

  /**
   * Variable data type as string
   */
  dataType: string
}


/**
 * Extracted ENUM definition
 */
export interface ExtractedEnum {
  /**
   * ENUM data type as string
   */

  dataType: string,
  /**
   * ENUM members (name and value)
   */
  content: Record<string, number>,

  /**
   * Resolved IEC data type (undefined if not yet resolved)
   */
  resolved?: IecType,
}

/**
 * Extracted ALIAS definition
 */
export interface ExtractedAlias {
  /**
   * ALIAS data type as string
   */
  dataType: string,

  /**
   * Resolved IEC data type (undefined if not yet resolved)
   */
  resolved?: IecType,
}

/**
 * Return value when iterating through types
 */
export interface IteratedIecType {
  /**
   * Variable name
   */
  name?: string,

  /**
   * Start index
   */
  startIndex: number,

  /**
   * Data type
   */
  type: IecType
}