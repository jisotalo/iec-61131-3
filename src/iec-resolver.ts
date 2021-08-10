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



import * as types from "./iec-types"

import { ExtractedStruct, ExtractedStructVariable, IecType } from "./types/types"


/**
 * Available non-complex IEC types
 */
const nonComplexTypes = [
  types.BOOL,
  types.USINT,
  types.BYTE,
  types.SINT,
  types.UINT,
  types.WORD,
  types.INT,
  types.DINT,
  types.UDINT,
  types.DWORD,
  types.TIME,
  types.TOD,
  types.TIME_OF_DAY,
  types.DT,
  types.DATE_AND_TIME,
  types.DATE,
  types.REAL,
  types.LREAL,
  types.ULINT,
  types.LWORD,
  types.LINT
]



/**
 * RegExp pattern for matching TYPEs like STRUCT etc.
 *  TYPE
 *   ...
 *  END_TYPE
 */
const typeRegEx = new RegExp(/type\s*(\w*)\s*:(.*?)end_type/gis)

/**
 * RegExp pattern for matching STRUCT variables (children)
 */
const structVariableRegEx = new RegExp(/(\w+)\s*:\s*([^:;]*)/gis)


/**
 * RegExp pattern for matching STRING or WSTRING types
 *  STRING (=80)
 *  WSTRING (=80)
 *  STRING(123)
 *  WSTRING(123)
 *  STRING[123]
 *  WSTRING[123]
 */
const stringRegEx = new RegExp('^(STRING|WSTRING)([\\[\\(](.*?)[\\)\\]])*$', 'i')


/**
 * RegExp pattern for matching ARRAY types
 */
const arrayRegEx = new RegExp(/array\s*[\[(]+(.*?)[\])]\s*of\s*([^:;]*)/gis)


/**
 * RegExp pattern for matching ARRAY dimensions
 * Input: "0..10", "-5..5, 0..2" etc
 */
const arrayDimensionsRegEx = new RegExp(/(?:\s*(?:([^\.,\s]*)\s*\.\.\s*([^,\s]*))\s*)/gis)


/**
 * Extracts struct declarations from given string containing one or multiple TYPE...END_TYPE declarations
 * @param declaration 
 */
const extractStructDeclarations = (declarations: string): ExtractedStruct[] => {

  const extractedStructs: ExtractedStruct[] = []
  let match: RegExpExecArray | null
  const typeMatcher = new RegExp(typeRegEx)
  
  //Looping until all no more declarations found
  //TODO: Add checks if RegExp was successful
  while ((match = typeMatcher.exec(declarations)) !== null) {

    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === typeMatcher.lastIndex) {
      typeMatcher.lastIndex++;
    }

    //Creating new temporary extracted struct object
    extractedStructs.push({
      dataType: match[1],
      children: extractStructVariables(match[2]),
      resolved: undefined
    })
  }


  return extractedStructs
}



/**
 * Extracts struct variables (children) from given declaration string
 * @param declaration 
 * @returns 
 */
const extractStructVariables = (declaration: string): ExtractedStructVariable[] => {

  const extractedVariables: ExtractedStructVariable[] = []

  let match: RegExpExecArray | null
  const structVariableMatcher = new RegExp(structVariableRegEx)

  //TODO: Add checks if RegExp was successful
  while ((match = structVariableMatcher.exec(declaration)) !== null) {

    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === structVariableMatcher.lastIndex) {
      structVariableMatcher.lastIndex++
    }

    extractedVariables.push({
      name: match[1],
      dataType: match[2].trim() //Removing whitespace here (TODO: with regexp?)
    })
  }

  return extractedVariables
}





/**
 * Resolves given string PLC STRUCT declaration to IEC data types
 * @param declarations 
 * @param topLevelDataType 
 * @param providedTypes 
 * @returns 
 */
export const resolveIecStructs = (declarations: string, topLevelDataType?: string, providedTypes?: Record<string, IecType>): IecType => {
  //First extracting struct definitions from string
  const structs = extractStructDeclarations(declarations)

  //If multiple structs found, we need to know which one is the top-level
  if (!topLevelDataType && structs.length > 1) {
    throw new Error('Top level data type name (topLevelDataType) is not given and many struct declarations found. Not possible to guess.')

  } else if (!topLevelDataType) {
    //When only one struct type found, we know it's the top-level
    topLevelDataType = structs[0].dataType
  }

  //Resolving structs to IEC data types
  for (const struct of structs) {
    //If already resolved, skip (happens if some other struct already depended on it)
    if (struct.resolved)
      continue
    
    struct.resolved = resolveIecStruct(struct, structs, providedTypes)
  }

  //Return the top-level struct
  const returnVal = structs.find(struct => topLevelDataType !== undefined && struct.dataType.toLowerCase() === topLevelDataType.toLowerCase())

  if (!returnVal) {
    throw new Error(`Top-level type ${topLevelDataType} was not found - Is data type declaration provided? Types found: ${structs.map(struct => struct.dataType).join(', ')}`)
  }

  return types.STRUCT(returnVal.resolved)
}




/**
 * Resolves a single struct to IEC data type 
 * @param struct 
 * @param structs 
 * @param providedTypes 
 * @returns 
 */
const resolveIecStruct = (struct: ExtractedStruct, structs: ExtractedStruct[], providedTypes?: Record<string, IecType>): Record<string, IecType> => {
  const resolved = {} as Record<string, IecType>

  for (const variable of struct.children) {
    resolved[variable.name] = resolveIecVariable(variable.dataType, structs, providedTypes)
  }

  return resolved
}



/**
 * Resolves a single variable to IEC data type
 * Calls itself recursively if needed (like array types)
 * @param dataType 
 * @param structs 
 * @param providedTypes 
 * @returns 
 */
const resolveIecVariable = (dataType: string, structs: ExtractedStruct[], providedTypes?: Record<string, IecType>): IecType => {
  //Simple non-complex data type
  let type: IecType | undefined = nonComplexTypes.find(type => type.type.toLowerCase() === dataType.toLowerCase())

  if (type) {
    return type
  }

  //String or wstring
  //TODO: Add checks if RegExp was successful
  const stringMatcher = new RegExp(stringRegEx)
  const stringMatch = stringMatcher.exec(dataType)

  if (stringMatch) {
    if (stringMatch[1].toLowerCase() === 'string') {
      return types.STRING(stringMatch[3] ? parseInt(stringMatch[3]) : 80)

    } else if (stringMatch[1].toLowerCase() === 'wstring') {
      return types.WSTRING(stringMatch[3] ? parseInt(stringMatch[3]) : 80)

    } else {
      throw new Error(`Unknown STRING definition: "${stringMatch}"`)
    }
  }
  
  //Array
  //TODO: Add checks if RegExp was successful
  const arrayMatcher = new RegExp(arrayRegEx)
  const arrayMatch = arrayMatcher.exec(dataType)

  if (arrayMatch) {
    type = resolveIecVariable(arrayMatch[2], structs, providedTypes)
  
    if (!type) {
      //This shouldn't happen
      throw new Error(`Unknown array data type "${arrayMatch[2]}"`)
    }

    //Array dimensions
    const dimensions = []
    
    let match: RegExpExecArray | null
    const arrayDimensionsMatcher = new RegExp(arrayDimensionsRegEx)
    
    //TODO: Add checks if RegExp was successful
    while ((match = arrayDimensionsMatcher.exec(arrayMatch[1])) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === arrayDimensionsMatcher.lastIndex) {
        arrayDimensionsMatcher.lastIndex++
      }

      dimensions.push(parseInt(match[2]) - parseInt(match[1]) + 1)
    }
    return types.ARRAY(type, dimensions)
  }


  //Struct (or unknown)
  const struct = structs.find(struct => struct.dataType.toLowerCase() == dataType.toLowerCase())

  if (struct) {
    //If struct is found but not yet resolved, resolve it now
    if (!struct.resolved) {
      struct.resolved = resolveIecStruct(struct, structs, providedTypes)
    }

    return types.STRUCT(struct.resolved)

  } else {
    //Struct type was unknown. Was it provided already?
    if (providedTypes) {
      const key = Object.keys(providedTypes).find(key => key.toLowerCase() === dataType.toLowerCase())

      if (key) {
        return providedTypes[key]
      } else {
        throw new Error(`Unknown data type "${dataType}" found! Types found from declaration: ${structs.map(struct => struct.dataType).join(', ')}, types provided separately: ${Object.keys(providedTypes).join(',')}`)
      }
    } else {
      throw new Error(`Unknown data type "${dataType}" found! Types found from declaration: ${structs.map(struct => struct.dataType).join(', ')}`)
    }
  }
}
