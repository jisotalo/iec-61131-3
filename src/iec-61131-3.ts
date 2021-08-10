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
  IecType
} from './types/types'

import { resolveIecStructs } from './iec-resolver'


/**
 * Exporting all IEC data types
 */
export * from './iec-types'



/**
 * Converts given IEC structure declaration(s) to data type. 
 * - If only one struct declaration given, it's selected automatically.
 * - If multiple given, top-level type needs to be given as 2nd parameter.
 * - Additionally, IEC data types can be provided as 3rd parameter {name: type}
 * 
 * @param declarations PLC IEC-61131-3 struct type declarations (one or multiple)
 * @param topLevelDataType If multiple struct type declarations given, the top-level struct type name needs to be provided (= which struct should be returned as IEC type)
 * @param providedTypes Object containing struct data type names and their IEC types if required (if some structs are defined somewhere else) - like {'ST_Example': STRUCT(...)}
 * @returns 
 */
export const fromString = (declarations: string, topLevelDataType?: string, providedTypes?: Record<string, IecType>): IecType => {
  return resolveIecStructs(declarations, topLevelDataType, providedTypes)
}




 