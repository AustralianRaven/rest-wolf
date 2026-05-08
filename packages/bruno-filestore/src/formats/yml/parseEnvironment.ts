import type { Environment as BrunoEnvironment, EnvironmentVariable as BrunoEnvironmentVariable } from '@usebruno/schema-types/collection/environment';
import type { Environment } from '@opencollection/types/config/environments';
import type { Variable, SecretVariable } from '@opencollection/types/common/variables';
import { parseYml } from './utils';
import { uuid } from '../../utils';

const isSecretVariable = (v: Variable | SecretVariable): v is SecretVariable => {
  return 'secret' in v && v.secret === true;
};

const toBrunoEnvironmentVariables = (variables: (Variable | SecretVariable)[] | null | undefined): BrunoEnvironmentVariable[] => {
  if (!variables?.length) {
    return [];
  }

  return variables.map((v): BrunoEnvironmentVariable => {
    if (isSecretVariable(v)) {
      return {
        uid: uuid(),
        name: v.name || '',
        value: '',
        type: 'text',
        enabled: v.disabled !== true,
        secret: true
      };
    }
    const variable: BrunoEnvironmentVariable = {
      uid: uuid(),
      name: v.name || '',
      value: (typeof v.value === 'string' ? v.value : '') || '',
      type: 'text',
      enabled: v.disabled !== true,
      secret: false
    };
    return variable;
  });
};

const parseEnvironment = (ymlString: string): BrunoEnvironment => {
  try {
    const ocEnvironment: Environment & { auth?: any } = parseYml(ymlString);

    const brunoEnvironment: BrunoEnvironment & { auth?: any } = {
      uid: uuid(),
      name: ocEnvironment.name || 'Untitled Environment',
      variables: toBrunoEnvironmentVariables(ocEnvironment.variables)
    };

    if (ocEnvironment.auth && typeof ocEnvironment.auth === 'object') {
      (brunoEnvironment as any).auth = ocEnvironment.auth;
    }

    return brunoEnvironment as BrunoEnvironment;
  } catch (error) {
    console.error('Error parsing environment:', error);
    throw error;
  }
};

export default parseEnvironment;
