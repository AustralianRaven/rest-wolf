const _ = require('lodash');
const { getValueString, indentString, serializeAnnotations, buildAnnotationsFromVariable } = require('./utils');

const envToJson = (json) => {
  const meta = _.get(json, 'meta', null);
  const variables = _.get(json, 'variables', []);
  const externalSecrets = _.get(json, 'externalSecrets', null);
  const color = _.get(json, 'color', null);

  const vars = variables
    .filter((variable) => !variable.secret)
    .map((variable) => {
      const { name, value, enabled } = variable;
      const prefix = enabled ? '' : '~';
      const annotationPrefix = serializeAnnotations(buildAnnotationsFromVariable(variable));

      return indentString(`${annotationPrefix}${prefix}${name}: ${getValueString(value)}`);
    });

  const secretVars = variables
    .filter((variable) => variable.secret)
    .map((variable) => {
      const { name, enabled } = variable;
      const prefix = enabled ? '' : '~';
      const annotationPrefix = serializeAnnotations(buildAnnotationsFromVariable(variable));
      return indentString(`${annotationPrefix}${prefix}${name}`);
    });

  let metaBlock = '';
  if (meta && _.isObject(meta) && Object.keys(meta).length) {
    const lines = Object.entries(meta)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => indentString(`${key}: ${value}`));
    if (lines.length) {
      metaBlock = `meta {
${lines.join('\n')}
}
`;
    }
  }

  let output = metaBlock;

  if (!variables || !variables.length) {
    output += `vars {
}
`;
  }

  if (vars.length) {
    output += `vars {
${vars.join('\n')}
}
`;
  }

  if (secretVars.length) {
    output += `vars:secret [
${secretVars.join(',\n')}
]
`;
  }

  if (externalSecrets && externalSecrets.type) {
    const serializedVariables = (externalSecrets.variables || []).map(({ name, value }) =>
      indentString(`${name}: ${getValueString(value)}`)
    );

    output += `vars:externalsecrets:${externalSecrets.type} {
${serializedVariables.join('\n')}
}
`;
  }

  if (color) {
    output += `color: ${color}
`;
  }

  return output;
};

module.exports = envToJson;
