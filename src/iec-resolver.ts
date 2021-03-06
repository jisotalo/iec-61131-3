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



import * as iecTypes from "./iec-types"

import {
  dataTypeUnit,
  EnumEntry,
  ExtractedEnum,
  ExtractedType,
  IecType,
  ExtractedAlias,
  EnumDataType,
  ExtractedTypeVariable
} from "./types/types"


/**
 * Available non-complex IEC types
 */
const nonComplexTypes = [
  iecTypes.BOOL,
  iecTypes.USINT,
  iecTypes.BYTE,
  iecTypes.SINT,
  iecTypes.UINT,
  iecTypes.WORD,
  iecTypes.INT,
  iecTypes.DINT,
  iecTypes.UDINT,
  iecTypes.DWORD,
  iecTypes.TIME,
  iecTypes.TOD,
  iecTypes.TIME_OF_DAY,
  iecTypes.DT,
  iecTypes.DATE_AND_TIME,
  iecTypes.DATE,
  iecTypes.REAL,
  iecTypes.LREAL,
  iecTypes.ULINT,
  iecTypes.LWORD,
  iecTypes.LINT
]

/**
 * RegExp pattern for matching data type units DUTs (struct, union, alias, enum)
 */
const typeRegEx = new RegExp(/type\s*(\w*)\s*[:]*\s*(struct|union|\(|:)\s*(.*?)(?:end_struct|end_union|;|\)\s*([^\s]*?)\s*;)\s*end_type/gis)

/**
 * RegExp pattern for matching STRUCT variables (children)
 */
const structVariableRegEx = new RegExp(/(\w+)\s*:\s*([^:;]*)/gis)

/**
 * RegExp pattern for matching ENUM
 */
const enumRegEx = new RegExp(/\s*(.+?)\s*(?::=\s*(.*?)\s*)*(?:,|$)/gis)

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
 * @param declaration Declaration string
 * @returns Extracted data types
 */
const extractTypeDeclarations = (declarations: string): ExtractedType[] => {
  const extractedTypes: ExtractedType[] = []
  let match: RegExpExecArray | null
  const typeMatcher = new RegExp(typeRegEx)

  //Looping until all no more declarations found
  //TODO: Add checks if RegExp was successful
  while ((match = typeMatcher.exec(declarations)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === typeMatcher.lastIndex) {
      typeMatcher.lastIndex++;
    }

    if (match.length < 5) {
      throw new Error(`Problem extracting IEC type declaration from given string. RegExp result has less than 4 matches: ${JSON.stringify(match)}`)
    }

    const type = {
      resolved: undefined
    } as ExtractedType

    //Match 1 is the user-defined name
    type.name = match[1]

    //Match 2 provides info which type is it
    //Match 3 is the content (depends on type)
    switch (match[2].toLowerCase()) {
      //STRUCT:
      case 'struct':
        type.type = dataTypeUnit.STRUCT
        type.content = extractTypeVariables(match[3])
        break;

      //UNION:
      case 'union':
        type.type = dataTypeUnit.UNION
        type.content = extractTypeVariables(match[3])
        break;

      //ENUM:
      case '(':
        type.type = dataTypeUnit.ENUM
        type.content = extractEnum(match[3], match[4])
        break;
      
      //ALIAS:
      case ':':
        type.type = dataTypeUnit.ALIAS
        type.content = {
          dataType: match[3]
        } as ExtractedAlias
        break;
      
      default:
        throw new Error(`Problem extracting IEC data type (DUT) from given string. Found match: ${JSON.stringify(match)}`)
    }

    extractedTypes.push(type)
  }

  return extractedTypes
}

/**
 * Extracts STRUCT/UNION variables (children) from given declaration string
 * @param declaration 
 * @returns 
 */
const extractTypeVariables = (declaration: string): ExtractedTypeVariable[] => {

  const extractedVariables: ExtractedTypeVariable[] = []

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
 * Extracts ENUM from given declaration string
 * @param declaration 
 * @returns 
 */
const extractEnum = (declaration: string, dataType?: string): ExtractedEnum => {

  if (dataType === undefined || dataType === '')
    dataType = 'INT'
  
  const extractedEnum = {
    dataType,
    content: {}
  } as ExtractedEnum

  let match: RegExpExecArray | null
  const enumMatcher = new RegExp(enumRegEx)
  const enumList = [] as EnumEntry[]

  //TODO: Add checks if RegExp was successful
  while ((match = enumMatcher.exec(declaration)) !== null) {

    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === enumMatcher.lastIndex) {
      enumMatcher.lastIndex++
    }

    let value = match[2] === undefined ? undefined : parseInt(match[2])
    
    //If value is undefined, it's not provided in the ENUM
    //--> The value is previous value + 1 if available
    //Otherwise value is 0
    if (value === undefined && enumList.length > 0) {
      value = enumList[enumList.length - 1].value + 1
      
    } else if(value === undefined){
      value = 0
    }

    if (value === undefined)
      throw new Error(`Problem calculating ENUM entry "${match[1]}". Found match: ${JSON.stringify(match)}`)

    //TODO: When adding support for constants edit this
    //We could have ENUM that has value := SOME_CONSTANT
    if (isNaN(value))
      throw new Error(`Problem calculating ENUM entry "${match[1]}" value from "${match[2]}". Found match: ${JSON.stringify(match)}`)

    enumList.push({
      name: match[1],
      value
    })

    extractedEnum.content[match[1]] = value
  }

  return extractedEnum
}

/**
 * Resolves given string PLC type declarations to IEC data types
 * @param declarations 
 * @param topLevelDataType 
 * @param providedTypes 
 * @returns 
 */
export const resolveIecTypes = (declarations: string, topLevelDataType?: string, providedTypes?: Record<string, IecType>): IecType => {
  //First extracting basic type definitions from string
  const types = extractTypeDeclarations(declarations)

  //If multiple data types found, we need to know which one is the top-level
  if (!topLevelDataType && types.length > 1) {
    throw new Error('Top level data type name (topLevelDataType) is not given and multiple type declarations found. Not possible to guess.')

  } else if (!topLevelDataType) {
    //When only one type found, we know it's the top-level
    topLevelDataType = types[0].name
  }
  
  //Resolving types to IEC data types
  for (const type of types) {
    //If already resolved, skip (happens if some other type already depended on it)
    if (type.resolved)
      continue
    
    type.resolved = resolveIecDataTypeUnit(type, types, providedTypes)
  }

  //Return the top-level struct
  const returnVal = types.find(type => topLevelDataType !== undefined && type.name.toLowerCase() === topLevelDataType.toLowerCase())

  if (!returnVal) {
    throw new Error(`Top-level type ${topLevelDataType} was not found - Is data type declaration provided? Types found: ${types.map(type => type.name).join(', ')}`)
  }

  return returnVal.resolved as IecType
}

/**
 * Resolves single IEC data type unit from given parsed ExtractedType object
 * 
 * @param type Type to be resolved
 * @param types List of all available types that are/will be resolved
 * @param providedTypes List of user-provided types
 * @returns Resolved type (IecType object)
 */
const resolveIecDataTypeUnit = (type: ExtractedType, types: ExtractedType[], providedTypes?: Record<string, IecType>): IecType => {

  switch (type.type) {
    case dataTypeUnit.STRUCT: {
      const children = {} as Record<string, IecType>

      for (const variable of type.content as ExtractedTypeVariable[]) {
        children[variable.name] = resolveIecVariable(variable.dataType, types, providedTypes)
      }
      return iecTypes.STRUCT(children)
    }

    case dataTypeUnit.UNION: {
      //Basically 1:1 as struct
      const children = {} as Record<string, IecType>

      for (const variable of type.content as ExtractedTypeVariable[]) {
        children[variable.name] = resolveIecVariable(variable.dataType, types, providedTypes)
      }
      return iecTypes.UNION(children)
    }
    
    case dataTypeUnit.ENUM: {
      const enumeration = type.content as ExtractedEnum
      
      //TODO: Check if valid ENUM data type
      return iecTypes.ENUM(enumeration.content, resolveIecVariable(enumeration.dataType, types, providedTypes) as EnumDataType)
    }

    case dataTypeUnit.ALIAS:
      return resolveIecVariable((type.content as ExtractedAlias).dataType, types, providedTypes)

    default:
      throw new Error(`Problem resolving IEC data type unit (DUT). Unknown type: ${type.type}`)
  }
}

/**
 * Resolves a single variable data type (string) to IEC data type
 * Calls itself recursively if needed (like array types)
 * @param dataType Data type name as string
 * @param structs List of all available types that are/will be resolved
 * @param providedTypes List of user-provided types
 * @returns Resolved type (IecType object)
 */
const resolveIecVariable = (dataType: string, types: ExtractedType[], providedTypes?: Record<string, IecType>): IecType => {
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
      return iecTypes.STRING(stringMatch[3] ? parseInt(stringMatch[3]) : 80)

    } else if (stringMatch[1].toLowerCase() === 'wstring') {
      return iecTypes.WSTRING(stringMatch[3] ? parseInt(stringMatch[3]) : 80)

    } else {
      throw new Error(`Unknown STRING definition: "${stringMatch}"`)
    }
  }
  
  //Array
  //TODO: Add checks if RegExp was successful
  const arrayMatcher = new RegExp(arrayRegEx)
  const arrayMatch = arrayMatcher.exec(dataType)

  if (arrayMatch) {
    type = resolveIecVariable(arrayMatch[2], types, providedTypes)
  
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
    return iecTypes.ARRAY(type, dimensions)
  }

  //Data type unit (DUT) like struct, enum etc. (or unknown)
  const dataTypeUnit = types.find(type => type.name.toLowerCase() == dataType.toLowerCase())

  if (dataTypeUnit) {
    //If type is found but not yet resolved, resolve it now
    if (!dataTypeUnit.resolved) {
      dataTypeUnit.resolved = resolveIecDataTypeUnit(dataTypeUnit, types, providedTypes)
    }

    return dataTypeUnit.resolved as IecType

  } else {
    //Data type was unknown. Was it provided already?
    if (providedTypes) {
      const key = Object.keys(providedTypes).find(key => key.toLowerCase() === dataType.toLowerCase())

      if (key) {
        return providedTypes[key]
      } else {
        throw new Error(`Unknown data type "${dataType}" found! Types found from declaration: ${types.map(type => type.name).join(', ')}, types provided separately: ${Object.keys(providedTypes).join(',')}`)
      }
    } else {
      throw new Error(`Unknown data type "${dataType}" found! Types found from declaration: ${types.map(type => type.name).join(', ')}`)
    }
  }
}
