const immutable = require('immutable')

const TYPE_CONVERSIONS = require('./conversions')

// Conversion utilities

const conversionsForTypeSystems = (fromTypeSystem, toTypeSystem) => {
  let conversions = TYPE_CONVERSIONS.getIn([fromTypeSystem, toTypeSystem])
  if (conversions === undefined) {
    throw new Error(
      `Conversions from '${fromTypeSystem}' to '${toTypeSystem}' are not supported`,
    )
  }
  return conversions
}

const objectifyConversion = (fromTypeSystem, toTypeSystem, conversion) => {
  return immutable.fromJS({
    from: {
      typeSystem: fromTypeSystem,
      type: conversion.get(0),
    },
    to: {
      typeSystem: toTypeSystem,
      type: conversion.get(1),
    },
    convert: conversion.get(2),
  })
}

const findConversionFromType = (fromTypeSystem, toTypeSystem, fromType) => {
  let conversions = conversionsForTypeSystems(fromTypeSystem, toTypeSystem)

  let conversion = conversions.find(conversion =>
    typeof conversion.get(0) === 'string'
      ? conversion.get(0) === fromType
      : fromType.match(conversion.get(0)),
  )

  if (conversion === undefined) {
    throw new Error(
      `Conversion from '${fromTypeSystem}' to '${toTypeSystem}' for ` +
        `source type '${fromType}' is not supported`,
    )
  }

  return objectifyConversion(fromTypeSystem, toTypeSystem, conversion)
}

const findConversionToType = (fromTypeSystem, toTypeSystem, toType) => {
  let conversions = conversionsForTypeSystems(fromTypeSystem, toTypeSystem)

  let conversion = conversions.find(conversion =>
    typeof conversion.get(1) === 'string'
      ? conversion.get(1) === toType
      : toType.match(conversion.get(1)),
  )

  if (conversion === undefined) {
    throw new Error(
      `Conversion from '${fromTypeSystem}' to '${toTypeSystem}' for ` +
        `target type '${toType}' is not supported`,
    )
  }

  return objectifyConversion(fromTypeSystem, toTypeSystem, conversion)
}

const findInitializationForType = (fromTypeSystem, toTypeSystem, ascType) => {
  const conversions = conversionsForTypeSystems(fromTypeSystem, toTypeSystem)

  const conversion = conversions.find(conversion =>
    typeof conversion.get(0) === 'string'
      ? conversion.get(0) === ascType
      : ascType.match(conversion.get(0)),
  )

  if (conversion === undefined) {
    throw new Error(
      `Conversion from '${fromTypeSystem}' to '${toTypeSystem}' for ` +
        `target type '${ascType}' is not supported`,
    )
  }

  const conversionObj = objectifyConversion(fromTypeSystem, toTypeSystem, conversion)

  return conversionObj.get('convert')(conversion.get(3))
}

// High-level type system API

const ascTypeForEthereum = ethereumType =>
  findConversionFromType('ethereum', 'AssemblyScript', ethereumType).getIn(['to', 'type'])

const ethereumTypeForAsc = ascType =>
  findConversionFromType('AssemblyScript', 'ethereum', ascType).getIn(['to', 'type'])

const ethereumToAsc = (code, ethereumType, internalType) =>
  findConversionFromType('ethereum', 'AssemblyScript', ethereumType).get('convert')(
    code,
    internalType,
  )

const ethereumFromAsc = (code, ethereumType) =>
  findConversionToType('AssemblyScript', 'ethereum', ethereumType).get('convert')(code)

const ascTypeForValue = valueType =>
  findConversionFromType('Value', 'AssemblyScript', valueType).getIn(['to', 'type'])

const valueTypeForAsc = ascType =>
  findConversionFromType('AssemblyScript', 'Value', ascType).getIn(['to', 'type'])

const valueToAsc = (code, valueType) =>
  findConversionFromType('Value', 'AssemblyScript', valueType).get('convert')(code)

const valueFromAsc = (code, valueType) =>
  findConversionToType('AssemblyScript', 'Value', valueType).get('convert')(code)

const initializedValueFromAsc = ascType =>
  findInitializationForType('AssemblyScript', 'Value', ascType)

module.exports = {
  // ethereum <-> AssemblyScript
  ascTypeForEthereum,
  ethereumTypeForAsc,
  ethereumToAsc,
  ethereumFromAsc,

  // Value <-> AssemblyScript
  ascTypeForValue,
  valueTypeForAsc,
  valueToAsc,
  valueFromAsc,
  initializedValueFromAsc,
}
