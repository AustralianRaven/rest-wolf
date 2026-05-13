const _ = require('lodash');
const { getValueString, indentString, serializeAnnotations } = require('./utils');

const envToJson = (json) => {
  const meta = _.get(json, 'meta', null);
  const variables = _.get(json, 'variables', []);
  const color = _.get(json, 'color', null);

  const vars = variables
    .filter((variable) => !variable.secret)
    .map((variable) => {
      const { name, value, enabled, annotations } = variable;
      const prefix = enabled ? '' : '~';

      return indentString(`${serializeAnnotations(annotations)}${prefix}${name}: ${getValueString(value)}`);
    });

  const secretVars = variables
    .filter((variable) => variable.secret)
    .map((variable) => {
      const { name, enabled } = variable;
      const prefix = enabled ? '' : '~';
      return indentString(`${prefix}${name}`);
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

  if (color) {
    output += `color: ${color}
`;
  }

  return output;
};

module.exports = envToJson;
