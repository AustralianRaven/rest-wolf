const _ = require('lodash');
const { getValueString, indentString } = require('./utils');

const envToJson = (json) => {
  const meta = _.get(json, 'meta', null);
  const variables = _.get(json, 'variables', []);
  const vars = variables
    .filter((variable) => !variable.secret)
    .map((variable) => {
      const { name, value, enabled } = variable;
      const prefix = enabled ? '' : '~';

      return indentString(`${prefix}${name}: ${getValueString(value)}`);
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

  if (!variables || !variables.length) {
    return `${metaBlock}vars {
}
`;
  }

  let output = metaBlock;
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

  return output;
};

module.exports = envToJson;
